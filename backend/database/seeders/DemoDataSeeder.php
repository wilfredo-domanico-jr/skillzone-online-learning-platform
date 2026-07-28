<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\CourseLevel;
use App\Enums\CourseStatus;
use App\Enums\CouponType;
use App\Enums\EnrollmentSource;
use App\Enums\InstructorApplicationStatus;
use App\Enums\LessonType;
use App\Enums\OrderStatus;
use App\Enums\PayoutStatus;
use App\Models\Category;
use App\Models\Coupon;
use App\Models\Course;
use App\Models\CourseSection;
use App\Models\Enrollment;
use App\Models\InstructorApplication;
use App\Models\InstructorPayout;
use App\Models\Lesson;
use App\Models\LessonArticle;
use App\Models\LessonAttachment;
use App\Models\LessonVideoDetail;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Quiz;
use App\Models\QuizAnswer;
use App\Models\QuizQuestion;
use App\Models\Review;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Populates the catalog with a large, realistic-looking dataset for manual
 * QA / demoing — instructors, students, courses with full curricula,
 * enrollments, reviews, orders, and payout history. Additive: does not
 * touch existing rows (courses use Course's own unique-slug generation, so
 * re-running this just creates another batch rather than erroring).
 *
 * Seeded video/attachment lessons get a tiny placeholder file written to
 * the 'local' disk so the signed stream/download URLs resolve instead of
 * 404ing — the content itself is not a playable video or a real document.
 */
class DemoDataSeeder extends Seeder
{
    private const INSTRUCTOR_COUNT = 12;

    private const STUDENT_COUNT = 60;

    /** @var array<string, array{name: string, bio: string, expertise: array<int, string>}> */
    private array $instructorProfiles = [
        'Sarah Chen' => ['bio' => 'Senior software engineer with 10+ years building web applications at scale. Passionate about teaching clean, practical code.', 'expertise' => ['JavaScript', 'React', 'Node.js']],
        'Marcus Johnson' => ['bio' => 'Full-stack developer and technical lead who has shipped products used by millions of users.', 'expertise' => ['PHP', 'Laravel', 'MySQL']],
        'Priya Patel' => ['bio' => 'Product designer turned educator, focused on making UI/UX approachable for beginners.', 'expertise' => ['UI Design', 'Figma', 'Design Systems']],
        'David Kim' => ['bio' => 'Growth marketer who has run campaigns for Fortune 500 brands and scrappy startups alike.', 'expertise' => ['SEO', 'Paid Ads', 'Growth Marketing']],
        'Emily Rodriguez' => ['bio' => 'Certified project manager (PMP) with a decade of experience leading cross-functional teams.', 'expertise' => ['Project Management', 'Agile', 'Leadership']],
        'James Wilson' => ['bio' => 'Cloud architect specializing in AWS and Kubernetes, helping teams modernize their infrastructure.', 'expertise' => ['AWS', 'Kubernetes', 'DevOps']],
        'Olivia Martinez' => ['bio' => 'Award-winning graphic designer with a background in branding and visual storytelling.', 'expertise' => ['Branding', 'Illustration', 'Typography']],
        'Michael Brown' => ['bio' => 'Data scientist and educator, making machine learning accessible to everyone.', 'expertise' => ['Python', 'Machine Learning', 'SQL']],
        'Sophia Lee' => ['bio' => 'Career coach and public speaker helping professionals level up their soft skills.', 'expertise' => ['Public Speaking', 'Career Coaching']],
        'Daniel Anderson' => ['bio' => 'Security engineer with experience defending infrastructure at scale.', 'expertise' => ['Cybersecurity', 'Networking', 'Linux']],
        'Grace Thompson' => ['bio' => 'Content strategist and copywriter who has grown blogs from zero to millions of readers.', 'expertise' => ['Copywriting', 'Content Strategy']],
        'Ryan Garcia' => ['bio' => 'Entrepreneur and startup advisor who has founded and sold two companies.', 'expertise' => ['Entrepreneurship', 'Fundraising', 'Strategy']],
    ];

    /** @var array<string, array<int, string>> */
    private array $courseTitlesByCategory = [
        'Development' => [
            'The Complete Web Development Bootcamp',
            'Modern JavaScript from Scratch',
            'React — The Complete Guide',
            'Python for Beginners: Zero to Hero',
            'Mastering TypeScript for Real Projects',
            'Full-Stack Laravel & Vue Developer Course',
            'Advanced Node.js and API Design',
            'Data Structures & Algorithms in Java',
        ],
        'Business' => [
            'The Complete Entrepreneurship Course',
            'Financial Modeling for Startups',
            'Project Management Professional (PMP) Prep',
            'Business Strategy: From Idea to Execution',
            'Excel for Business Analytics',
            'Negotiation Skills for Managers',
            'Startup Fundraising Masterclass',
            'Lean Six Sigma Green Belt Certification',
        ],
        'Design' => [
            'UI/UX Design Essentials',
            'Figma for Product Designers',
            'Graphic Design Masterclass',
            'Adobe Photoshop for Beginners',
            'Design Systems: Building for Scale',
            'Typography and Visual Hierarchy',
            '3D Modeling with Blender',
            'Motion Design with After Effects',
        ],
        'Marketing' => [
            'Digital Marketing Masterclass',
            'SEO Fundamentals: Rank Higher on Google',
            'Social Media Marketing Strategy',
            'Email Marketing That Converts',
            'Content Marketing & Copywriting',
            'Google Ads & PPC Advertising',
            'Growth Hacking for Startups',
            'Brand Strategy and Storytelling',
        ],
        'IT & Software' => [
            'AWS Certified Solutions Architect',
            'Docker and Kubernetes for Developers',
            'Linux Administration Bootcamp',
            'Cybersecurity Fundamentals',
            'Networking Basics for IT Professionals',
            'DevOps Engineering from Scratch',
            'SQL for Data Analysis',
            'Introduction to Machine Learning',
        ],
        'Personal Development' => [
            'Productivity Mastery: Get More Done',
            'Public Speaking and Presentation Skills',
            'The Complete Time Management System',
            'Critical Thinking and Problem Solving',
            'Emotional Intelligence at Work',
            'Career Change Blueprint',
            'Mindfulness and Stress Management',
            'Leadership Skills for New Managers',
        ],
    ];

    private array $sectionTitlePool = [
        'Getting Started',
        'Core Concepts',
        'Hands-On Practice',
        'Building a Real Project',
        'Advanced Techniques',
        'Wrapping Up & Next Steps',
    ];

    private array $videoLessonTitlePool = [
        'Course Introduction & Overview',
        'Setting Up Your Environment',
        'Core Concept Walkthrough',
        'Live Demo: Building the First Feature',
        'Deep Dive: Best Practices',
        'Common Pitfalls and How to Avoid Them',
        'Real-World Case Study',
        'Putting It All Together',
    ];

    private array $articleLessonTitlePool = [
        'Key Terms & Definitions',
        'Background and Context',
        'Reference Guide',
        'Summary & Cheat Sheet',
    ];

    private array $resourceLessonTitlePool = [
        'Downloadable Resources',
        'Slides & Templates',
        'Project Starter Files',
    ];

    private array $quizQuestionPool = [
        ['text' => 'Which of the following best describes the main concept covered in this section?', 'type' => 'single_choice'],
        ['text' => 'True or False: following best practices always requires additional review before shipping.', 'type' => 'true_false'],
        ['text' => 'Select all statements that are correct according to this lesson.', 'type' => 'multiple_choice'],
        ['text' => 'What is the most important consideration when applying this technique in a real project?', 'type' => 'single_choice'],
        ['text' => 'True or False: this approach works the same way in every situation.', 'type' => 'true_false'],
        ['text' => 'Which of these are common mistakes beginners make with this topic?', 'type' => 'multiple_choice'],
        ['text' => 'What should you do first when starting this kind of task?', 'type' => 'single_choice'],
    ];

    private array $reviewComments = [
        5 => [
            "This course exceeded my expectations. Clear explanations and practical examples.",
            "Absolutely loved it! I finally understand concepts I've struggled with for years.",
            "Best course I've taken on this platform. Highly recommend.",
            "The instructor explains everything so clearly. Worth every penny.",
            "Incredible value. I went from confused to confident in a few weeks.",
        ],
        4 => [
            "Really solid course overall. A couple of sections felt a bit rushed.",
            "Great content and well organized. Would love more real-world examples.",
            "Learned a lot! Some of the later lessons could use more detail.",
        ],
        3 => [
            "Decent course, but some of the material felt outdated.",
            "It's fine as an introduction, but don't expect deep coverage.",
        ],
        2 => [
            "Audio quality wasn't great and some lessons felt repetitive.",
        ],
        1 => [
            "Didn't match the description. Expected more advanced content.",
        ],
    ];

    private array $rejectionReasons = [
        'Course content needs more depth in the later sections before we can approve.',
        'Please add captions/subtitles to your video lessons.',
        'The curriculum structure doesn\'t meet our minimum lesson count requirements.',
    ];

    public function run(): void
    {
        $this->command?->info('Seeding demo data — this can take a minute or two...');

        $admin = User::firstOrCreate(
            ['email' => 'admin@skillzone.test'],
            ['name' => 'Site Admin', 'email_verified_at' => now(), 'password' => Hash::make('password')]
        );
        if (! $admin->hasRole('admin')) {
            $admin->assignRole('admin');
        }

        $instructors = $this->instructors();
        $students = $this->students();

        $this->instructorApplications($instructors, $students, $admin);

        $courses = $this->courses($instructors);

        $this->command?->info("Building curriculum for {$courses->count()} courses...");
        foreach ($courses as $course) {
            $this->buildCurriculum($course);
        }

        $this->command?->info('Creating enrollments, orders, and reviews...');
        $this->enrollAndReview($courses, $students);

        $this->coupons();

        $this->command?->info('Generating instructor payouts from seeded orders...');
        $this->payouts();

        $this->command?->info('Generating course thumbnails...');
        Artisan::call('courses:backfill-thumbnails');

        $this->command?->info('Demo data seeding complete.');
    }

    /**
     * @return Collection<int, User>
     */
    private function instructors(): Collection
    {
        $instructors = new Collection();

        foreach ($this->instructorProfiles as $name => $profile) {
            $email = Str::slug($name).'@skillzone.test';

            $user = User::firstOrCreate(
                ['email' => $email],
                ['name' => $name, 'email_verified_at' => now(), 'password' => Hash::make('password')]
            );

            if (! $user->hasRole('instructor')) {
                $user->assignRole('instructor');
            }

            $instructors->push($user);
        }

        return $instructors;
    }

    /**
     * @return Collection<int, User>
     */
    private function students(): Collection
    {
        $students = new Collection();

        for ($i = 0; $i < self::STUDENT_COUNT; $i++) {
            $user = User::factory()->create();
            $user->assignRole('student');
            $students->push($user);
        }

        return $students;
    }

    /**
     * @param  Collection<int, User>  $instructors
     * @param  Collection<int, User>  $students
     */
    private function instructorApplications(Collection $instructors, Collection $students, User $admin): void
    {
        foreach ($instructors as $instructor) {
            $profile = $this->instructorProfiles[$instructor->name] ?? ['bio' => fake()->paragraph(), 'expertise' => []];
            $submittedAt = now()->subDays(fake()->numberBetween(60, 400));

            InstructorApplication::firstOrCreate(
                ['user_id' => $instructor->id],
                [
                    'status' => InstructorApplicationStatus::Approved,
                    'bio' => $profile['bio'],
                    'expertise' => $profile['expertise'],
                    'portfolio_url' => 'https://'.Str::slug($instructor->name).'.example.com',
                    'submitted_at' => $submittedAt,
                    'reviewed_at' => $submittedAt->copy()->addDays(2),
                    'reviewed_by' => $admin->id,
                ]
            );
        }

        // A handful of applicants who aren't (yet) instructors, for the
        // admin queue to have real pending/rejected content.
        $applicants = $students->random(5);

        foreach ($applicants as $index => $applicant) {
            $submittedAt = now()->subDays(fake()->numberBetween(1, 30));
            $isRejected = $index >= 3;

            InstructorApplication::firstOrCreate(
                ['user_id' => $applicant->id],
                [
                    'status' => $isRejected ? InstructorApplicationStatus::Rejected : InstructorApplicationStatus::Pending,
                    'bio' => fake()->paragraph(),
                    'expertise' => fake()->words(3),
                    'portfolio_url' => fake()->boolean(50) ? fake()->url() : null,
                    'submitted_at' => $submittedAt,
                    'reviewed_at' => $isRejected ? $submittedAt->copy()->addDays(3) : null,
                    'reviewed_by' => $isRejected ? $admin->id : null,
                    'rejection_reason' => $isRejected ? fake()->randomElement($this->rejectionReasons) : null,
                ]
            );
        }
    }

    /**
     * @param  Collection<int, User>  $instructors
     * @return Collection<int, Course>
     */
    private function courses(Collection $instructors): Collection
    {
        $prices = [0, 19.99, 29.99, 39.99, 49.99, 59.99, 79.99, 99.99, 129.99];
        $levels = [CourseLevel::Beginner, CourseLevel::Intermediate, CourseLevel::Advanced, CourseLevel::AllLevels];
        $created = new Collection();

        foreach ($this->courseTitlesByCategory as $categoryName => $titles) {
            $category = Category::where('name', $categoryName)->first();

            foreach ($titles as $index => $title) {
                // Mostly published, with a few in other states so the admin
                // moderation queue and instructor "my courses" list both
                // have realistic mixed content.
                $status = match (true) {
                    $index === 6 => CourseStatus::PendingReview,
                    $index === 7 => CourseStatus::Rejected,
                    default => CourseStatus::Published,
                };

                $publishedAt = $status === CourseStatus::Published
                    ? now()->subDays(fake()->numberBetween(5, 300))
                    : null;

                $course = Course::create([
                    'instructor_id' => $instructors->random()->id,
                    'category_id' => $category?->id,
                    'title' => $title,
                    'subtitle' => fake()->sentence(10),
                    'description' => implode("\n\n", fake()->paragraphs(4)),
                    'price' => fake()->randomElement($prices),
                    'level' => fake()->randomElement($levels),
                    'language' => 'en',
                    'requirements' => [
                        'A computer with internet access',
                        'No prior experience required — we start from the basics',
                        fake()->sentence(6),
                    ],
                    'what_you_will_learn' => [
                        fake()->sentence(8),
                        fake()->sentence(8),
                        fake()->sentence(8),
                        fake()->sentence(8),
                    ],
                ]);

                $course->forceFill(array_filter([
                    'status' => $status,
                    'published_at' => $publishedAt,
                    'rejection_reason' => $status === CourseStatus::Rejected ? fake()->randomElement($this->rejectionReasons) : null,
                ], fn ($v) => $v !== null))->save();

                $created->push($course);
            }
        }

        return $created;
    }

    private function buildCurriculum(Course $course): void
    {
        $sectionCount = fake()->numberBetween(3, 5);
        $sectionTitles = array_slice($this->sectionTitlePool, 0, $sectionCount);
        $quizPlaced = false;
        $position = 0;
        $lessons = [];

        foreach ($sectionTitles as $sectionIndex => $sectionTitle) {
            $section = CourseSection::create([
                'course_id' => $course->id,
                'title' => $sectionTitle,
                'position' => $sectionIndex,
            ]);

            $lessonCount = fake()->numberBetween(2, 5);

            for ($i = 0; $i < $lessonCount; $i++) {
                $isLastSection = $sectionIndex === $sectionCount - 1;
                $type = $this->pickLessonType($isLastSection && $i === $lessonCount - 1 && ! $quizPlaced);
                if ($type === LessonType::Quiz) {
                    $quizPlaced = true;
                }

                $lesson = $this->createLesson($section, $type, $position === 0);
                $lessons[] = $lesson;
                $position++;
            }
        }

        // Guarantee at least one quiz lesson per course.
        if (! $quizPlaced && count($lessons) > 2) {
            /** @var Lesson $target */
            $target = $lessons[array_rand(array_slice($lessons, 1, -1, true)) ?: 1];
            $target->videoDetail()->delete();
            $target->article()->delete();
            $target->forceFill(['type' => LessonType::Quiz])->save();
            $this->attachLessonContent($target, LessonType::Quiz);
        }
    }

    private function pickLessonType(bool $forceQuiz): LessonType
    {
        if ($forceQuiz) {
            return LessonType::Quiz;
        }

        return fake()->randomElement([
            ...array_fill(0, 5, LessonType::Video),
            ...array_fill(0, 3, LessonType::Article),
            ...array_fill(0, 1, LessonType::Resource),
            ...array_fill(0, 1, LessonType::Quiz),
        ]);
    }

    private function createLesson(CourseSection $section, LessonType $type, bool $isFirstOverall): Lesson
    {
        $title = match ($type) {
            LessonType::Video => fake()->randomElement($this->videoLessonTitlePool),
            LessonType::Article => fake()->randomElement($this->articleLessonTitlePool),
            LessonType::Quiz => fake()->randomElement(['Knowledge Check', 'Module Quiz', 'Test Your Understanding']),
            LessonType::Resource => fake()->randomElement($this->resourceLessonTitlePool),
        };

        $lesson = Lesson::create([
            'section_id' => $section->id,
            'title' => $title,
            'type' => $type,
            'position' => $section->lessons()->count(),
            'is_previewable' => $isFirstOverall,
            'duration_seconds' => $type === LessonType::Video ? fake()->numberBetween(180, 1500) : null,
        ]);

        $this->attachLessonContent($lesson, $type);

        return $lesson;
    }

    private function attachLessonContent(Lesson $lesson, LessonType $type): void
    {
        match ($type) {
            LessonType::Video => $this->attachVideo($lesson),
            LessonType::Article => LessonArticle::create([
                'lesson_id' => $lesson->id,
                'body_html' => $this->articleBodyHtml(),
            ]),
            LessonType::Resource => $this->attachResource($lesson),
            LessonType::Quiz => $this->attachQuiz($lesson),
        };
    }

    private function attachVideo(Lesson $lesson): void
    {
        $path = "demo/videos/lesson-{$lesson->id}.mp4";
        Storage::disk('local')->put($path, 'SKILLZONE-DEMO-PLACEHOLDER-VIDEO');

        LessonVideoDetail::create([
            'lesson_id' => $lesson->id,
            'disk' => 'local',
            'path' => $path,
            'duration_seconds' => $lesson->duration_seconds ?? fake()->numberBetween(180, 1500),
        ]);
    }

    private function attachResource(Lesson $lesson): void
    {
        $path = "demo/attachments/lesson-{$lesson->id}.txt";
        $content = "SkillZone demo resource for lesson #{$lesson->id}.\n\nThis placeholder stands in for real downloadable course material.";
        Storage::disk('local')->put($path, $content);

        LessonAttachment::create([
            'lesson_id' => $lesson->id,
            'file_name' => 'lesson-materials.txt',
            'disk' => 'local',
            'path' => $path,
            'file_size' => strlen($content),
            'mime_type' => 'text/plain',
        ]);
    }

    private function attachQuiz(Lesson $lesson): void
    {
        $quiz = Quiz::create([
            'lesson_id' => $lesson->id,
            'passing_score_percent' => 70,
            'max_attempts' => 3,
            'time_limit_minutes' => 15,
        ]);

        $questionCount = fake()->numberBetween(4, 6);
        $questions = fake()->randomElements($this->quizQuestionPool, min($questionCount, count($this->quizQuestionPool)));

        foreach ($questions as $position => $questionData) {
            $question = QuizQuestion::create([
                'quiz_id' => $quiz->id,
                'question_text' => $questionData['text'],
                'type' => $questionData['type'],
                'position' => $position,
                'points' => 1,
            ]);

            $this->createAnswers($question, $questionData['type']);
        }
    }

    private function createAnswers(QuizQuestion $question, string $type): void
    {
        if ($type === 'true_false') {
            $correctIsTrue = fake()->boolean();
            QuizAnswer::create(['question_id' => $question->id, 'answer_text' => 'True', 'is_correct' => $correctIsTrue, 'position' => 0]);
            QuizAnswer::create(['question_id' => $question->id, 'answer_text' => 'False', 'is_correct' => ! $correctIsTrue, 'position' => 1]);

            return;
        }

        $optionCount = fake()->numberBetween(3, 4);
        $options = [
            'This approach, applied consistently',
            'A completely unrelated technique',
            'Skipping this step entirely',
            'Doing the opposite of what was shown',
            'A partially correct but incomplete answer',
        ];
        $selected = fake()->randomElements($options, $optionCount);

        if ($type === 'single_choice') {
            $correctIndex = array_rand($selected);
            foreach ($selected as $i => $text) {
                QuizAnswer::create(['question_id' => $question->id, 'answer_text' => $text, 'is_correct' => $i === $correctIndex, 'position' => $i]);
            }

            return;
        }

        // multiple_choice: 1-2 correct answers.
        $correctIndexes = (array) array_rand($selected, min(2, count($selected)));
        foreach ($selected as $i => $text) {
            QuizAnswer::create(['question_id' => $question->id, 'answer_text' => $text, 'is_correct' => in_array($i, $correctIndexes, true), 'position' => $i]);
        }
    }

    private function articleBodyHtml(): string
    {
        $paragraphs = fake()->paragraphs(3);
        $bullets = fake()->sentences(4);

        $html = '<p>'.implode('</p><p>', $paragraphs).'</p>';
        $html .= '<ul><li>'.implode('</li><li>', $bullets).'</li></ul>';

        return $html;
    }

    /**
     * @param  Collection<int, Course>  $courses
     * @param  Collection<int, User>  $students
     */
    private function enrollAndReview(Collection $courses, Collection $students): void
    {
        $progressWeights = [0, 0, 10, 20, 25, 35, 45, 50, 60, 70, 75, 80, 90, 100, 100, 100];

        foreach ($courses as $course) {
            if ($course->status !== CourseStatus::Published) {
                continue;
            }

            $targetEnrollments = fake()->numberBetween(5, 45);
            $enrolledStudents = $students->random(min($targetEnrollments, $students->count()));
            $isPaid = (float) $course->price > 0;

            foreach ($enrolledStudents as $student) {
                $enrolledAt = Carbon::parse($course->published_at)
                    ->addDays(fake()->numberBetween(0, max(1, now()->diffInDays($course->published_at))))
                    ->min(now());

                $progress = fake()->randomElement($progressWeights);
                $completedAt = $progress === 100 ? $enrolledAt->copy()->addDays(fake()->numberBetween(1, 30)) : null;

                if ($isPaid) {
                    $order = Order::create([
                        'user_id' => $student->id,
                        'status' => OrderStatus::Paid,
                        'subtotal' => $course->price,
                        'discount_total' => 0,
                        'total' => $course->price,
                        'currency' => 'usd',
                        'paid_at' => $enrolledAt,
                    ]);
                    $order->forceFill(['created_at' => $enrolledAt, 'updated_at' => $enrolledAt])->save();

                    OrderItem::create([
                        'order_id' => $order->id,
                        'course_id' => $course->id,
                        'price_at_purchase' => $course->price,
                        'instructor_id' => $course->instructor_id,
                    ]);
                }

                $enrollment = Enrollment::create([
                    'user_id' => $student->id,
                    'course_id' => $course->id,
                    'source' => $isPaid ? EnrollmentSource::Purchase : EnrollmentSource::Free,
                    'enrolled_at' => $enrolledAt,
                    'completed_at' => $completedAt,
                    'progress_percent' => $progress,
                ]);
                $enrollment->forceFill(['created_at' => $enrolledAt, 'updated_at' => $enrolledAt])->save();

                if (fake()->boolean(45)) {
                    $rating = fake()->randomElement([5, 5, 5, 5, 4, 4, 4, 3, 3, 2, 1]);

                    Review::create([
                        'course_id' => $course->id,
                        'user_id' => $student->id,
                        'rating' => $rating,
                        'comment' => fake()->randomElement($this->reviewComments[$rating]),
                    ]);
                }
            }
        }
    }

    private function coupons(): void
    {
        Coupon::firstOrCreate(['code' => 'WELCOME10'], [
            'type' => CouponType::Percent, 'value' => 10, 'is_active' => true,
        ]);
        Coupon::firstOrCreate(['code' => 'SAVE20'], [
            'type' => CouponType::Percent, 'value' => 20, 'is_active' => true,
        ]);
        Coupon::firstOrCreate(['code' => 'FLASH5'], [
            'type' => CouponType::Fixed, 'value' => 5, 'is_active' => true, 'expires_at' => now()->addMonths(2),
        ]);
        Coupon::firstOrCreate(['code' => 'EXPIRED2025'], [
            'type' => CouponType::Percent, 'value' => 15, 'is_active' => false, 'expires_at' => now()->subMonths(3),
        ]);
    }

    private function payouts(): void
    {
        for ($monthsAgo = 1; $monthsAgo <= 10; $monthsAgo++) {
            $start = now()->subMonthsNoOverflow($monthsAgo)->startOfMonth();
            $end = now()->subMonthsNoOverflow($monthsAgo)->endOfMonth();

            Artisan::call('payouts:generate', [
                '--start' => $start->toDateString(),
                '--end' => $end->toDateString(),
            ]);
        }

        // Mark roughly 60% of the generated payouts as already paid, so the
        // admin/instructor payout pages show a realistic pending+paid mix.
        InstructorPayout::where('status', PayoutStatus::Pending)
            ->inRandomOrder()
            ->limit((int) (InstructorPayout::count() * 0.6))
            ->get()
            ->each(function (InstructorPayout $payout) {
                $payout->forceFill([
                    'status' => PayoutStatus::Paid,
                    'paid_at' => Carbon::parse($payout->period_end)->addDays(fake()->numberBetween(3, 10)),
                ])->save();
            });
    }
}
