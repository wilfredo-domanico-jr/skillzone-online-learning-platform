<?php

use App\Http\Controllers\Api\V1\Admin\CourseController as AdminCourseController;
use App\Http\Controllers\Api\V1\Admin\CouponController as AdminCouponController;
use App\Http\Controllers\Api\V1\Admin\InstructorApplicationController as AdminInstructorApplicationController;
use App\Http\Controllers\Api\V1\Admin\PayoutController as AdminPayoutController;
use App\Http\Controllers\Api\V1\Admin\UserController as AdminUserController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CartController;
use App\Http\Controllers\Api\V1\CategoryController;
use App\Http\Controllers\Api\V1\CheckoutController;
use App\Http\Controllers\Api\V1\CouponController;
use App\Http\Controllers\Api\V1\CourseController;
use App\Http\Controllers\Api\V1\EnrollmentController;
use App\Http\Controllers\Api\V1\Instructor\AnalyticsController;
use App\Http\Controllers\Api\V1\Instructor\CourseController as InstructorCourseController;
use App\Http\Controllers\Api\V1\Instructor\CourseSectionController;
use App\Http\Controllers\Api\V1\Instructor\LessonContentController;
use App\Http\Controllers\Api\V1\Instructor\LessonController;
use App\Http\Controllers\Api\V1\Instructor\PayoutController as InstructorPayoutController;
use App\Http\Controllers\Api\V1\Instructor\QuizController as InstructorQuizController;
use App\Http\Controllers\Api\V1\InstructorApplicationController;
use App\Http\Controllers\Api\V1\LearningController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\OrderController;
use App\Http\Controllers\Api\V1\ProfileController;
use App\Http\Controllers\Api\V1\QuizAttemptController;
use App\Http\Controllers\Api\V1\ReviewController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::post('/auth/register', [AuthController::class, 'register'])->middleware('guest');
    Route::post('/auth/login', [AuthController::class, 'login'])->middleware('guest');
    Route::post('/auth/demo-login', [AuthController::class, 'demoLogin'])->middleware('guest');
    Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('guest');
    Route::post('/auth/reset-password', [AuthController::class, 'resetPassword'])->middleware('guest');

    // Public catalog — no auth required, but $request->user() still resolves
    // opportunistically from the session cookie when present (e.g. so an
    // instructor previewing their own unpublished course sees full content).
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/courses', [CourseController::class, 'index']);
    Route::get('/courses/{slug}', [CourseController::class, 'show']);
    Route::get('/courses/{slug}/curriculum', [CourseController::class, 'curriculum']);
    Route::get('/courses/{slug}/reviews', [ReviewController::class, 'index']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::post('/auth/email/verification-notification', [AuthController::class, 'sendVerificationEmail'])
            ->middleware('throttle:6,1');
        Route::post('/auth/confirm-password', [AuthController::class, 'confirmPassword']);
        Route::put('/auth/password', [AuthController::class, 'updatePassword']);

        Route::patch('/profile', [ProfileController::class, 'update']);
        Route::delete('/profile', [ProfileController::class, 'destroy']);

        Route::post('/instructor-applications', [InstructorApplicationController::class, 'store']);
        Route::get('/instructor-applications/me', [InstructorApplicationController::class, 'me']);

        Route::get('/my/enrollments', [EnrollmentController::class, 'index']);
        Route::post('/courses/{slug}/enroll', [EnrollmentController::class, 'store']);

        Route::post('/lessons/{lesson}/complete', [LearningController::class, 'complete']);
        Route::post('/lessons/{lesson}/progress', [LearningController::class, 'updateProgress']);

        Route::get('/lessons/{lesson}/quiz', [QuizAttemptController::class, 'show']);
        Route::post('/lessons/{lesson}/quiz/attempts', [QuizAttemptController::class, 'start']);
        Route::post('/quiz-attempts/{attempt}/submit', [QuizAttemptController::class, 'submit']);
        Route::get('/quiz-attempts/{attempt}', [QuizAttemptController::class, 'showAttempt']);

        Route::get('/cart', [CartController::class, 'index']);
        Route::post('/cart/items', [CartController::class, 'store']);
        Route::delete('/cart/items/{course}', [CartController::class, 'destroy']);

        Route::post('/coupons/validate', [CouponController::class, 'validate']);

        Route::post('/checkout/session', [CheckoutController::class, 'store']);

        Route::get('/orders', [OrderController::class, 'index']);
        Route::get('/orders/{order}', [OrderController::class, 'show']);

        Route::post('/courses/{course}/reviews', [ReviewController::class, 'store']);
        Route::put('/reviews/{review}', [ReviewController::class, 'update']);
        Route::delete('/reviews/{review}', [ReviewController::class, 'destroy']);

        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::post('/notifications/{notificationId}/read', [NotificationController::class, 'markRead']);
        Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);

        Route::middleware('role:instructor')->prefix('instructor')->group(function () {
            Route::get('/courses', [InstructorCourseController::class, 'index']);
            Route::post('/courses', [InstructorCourseController::class, 'store']);
            Route::put('/courses/{course}', [InstructorCourseController::class, 'update']);
            Route::delete('/courses/{course}', [InstructorCourseController::class, 'destroy']);
            Route::post('/courses/{course}/submit-for-review', [InstructorCourseController::class, 'submitForReview']);

            Route::post('/courses/{course}/sections', [CourseSectionController::class, 'store']);
            Route::put('/sections/{section}', [CourseSectionController::class, 'update']);
            Route::delete('/sections/{section}', [CourseSectionController::class, 'destroy']);
            Route::post('/courses/{course}/sections/reorder', [CourseSectionController::class, 'reorder']);

            Route::post('/sections/{section}/lessons', [LessonController::class, 'store']);
            Route::put('/lessons/{lesson}', [LessonController::class, 'update']);
            Route::delete('/lessons/{lesson}', [LessonController::class, 'destroy']);
            Route::post('/sections/{section}/lessons/reorder', [LessonController::class, 'reorder']);

            Route::post('/lessons/{lesson}/video', [LessonContentController::class, 'uploadVideo']);
            Route::put('/lessons/{lesson}/article', [LessonContentController::class, 'updateArticle']);
            Route::post('/lessons/{lesson}/attachments', [LessonContentController::class, 'storeAttachment']);
            Route::delete('/attachments/{attachment}', [LessonContentController::class, 'destroyAttachment']);

            Route::get('/lessons/{lesson}/quiz', [InstructorQuizController::class, 'show']);
            Route::put('/lessons/{lesson}/quiz', [InstructorQuizController::class, 'upsertSettings']);
            Route::post('/quizzes/{quiz}/questions', [InstructorQuizController::class, 'storeQuestion']);
            Route::put('/questions/{question}', [InstructorQuizController::class, 'updateQuestion']);
            Route::delete('/questions/{question}', [InstructorQuizController::class, 'destroyQuestion']);
            Route::post('/quizzes/{quiz}/questions/reorder', [InstructorQuizController::class, 'reorderQuestions']);

            Route::get('/analytics/overview', [AnalyticsController::class, 'overview']);
            Route::get('/payouts', [InstructorPayoutController::class, 'index']);
        });

        Route::middleware('role:admin')->prefix('admin')->group(function () {
            Route::get('/instructor-applications', [AdminInstructorApplicationController::class, 'index']);
            Route::post('/instructor-applications/{instructorApplication}/approve', [AdminInstructorApplicationController::class, 'approve']);
            Route::post('/instructor-applications/{instructorApplication}/reject', [AdminInstructorApplicationController::class, 'reject']);

            Route::get('/courses', [AdminCourseController::class, 'index']);
            Route::post('/courses/{course}/approve', [AdminCourseController::class, 'approve']);
            Route::post('/courses/{course}/reject', [AdminCourseController::class, 'reject']);

            Route::get('/coupons', [AdminCouponController::class, 'index']);
            Route::post('/coupons', [AdminCouponController::class, 'store']);
            Route::put('/coupons/{coupon}', [AdminCouponController::class, 'update']);
            Route::delete('/coupons/{coupon}', [AdminCouponController::class, 'destroy']);

            Route::get('/payouts', [AdminPayoutController::class, 'index']);
            Route::post('/payouts/{payout}/mark-paid', [AdminPayoutController::class, 'markPaid']);

            Route::get('/users', [AdminUserController::class, 'index']);
            Route::post('/users/{user}/suspend', [AdminUserController::class, 'suspend']);
            Route::post('/users/{user}/unsuspend', [AdminUserController::class, 'unsuspend']);
        });
    });
});
