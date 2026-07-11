import { createBrowserRouter, Navigate } from 'react-router-dom';
import GuestLayout from './layouts/GuestLayout';
import AppLayout from './layouts/AppLayout';
import RequireAuth from './RequireAuth';
import NotFoundPage from './NotFoundPage';
import ForbiddenPage from './ForbiddenPage';
import LoginPage from '../features/auth/LoginPage';
import RegisterPage from '../features/auth/RegisterPage';
import OAuthCallbackPage from '../features/auth/OAuthCallbackPage';
import DashboardPage from '../features/dashboard/DashboardPage';
import CourseListPage from '../features/catalog/CourseListPage';
import CourseDetailPage from '../features/catalog/CourseDetailPage';
import ApplyPage from '../features/instructor/ApplyPage';
import InstructorCoursesPage from '../features/instructor/InstructorCoursesPage';
import CourseEditorPage from '../features/instructor/CourseEditorPage';
import ApplicationsQueuePage from '../features/admin/ApplicationsQueuePage';
import CourseModerationPage from '../features/admin/CourseModerationPage';
import AdminPayoutsPage from '../features/admin/PayoutsPage';
import AdminUsersPage from '../features/admin/UsersPage';
import InstructorDashboardPage from '../features/instructor/InstructorDashboardPage';
import MyLearningPage from '../features/learning/MyLearningPage';
import CoursePlayerPage from '../features/learning/CoursePlayerPage';
import CartPage from '../features/cart/CartPage';
import OrdersPage from '../features/orders/OrdersPage';
import OrderDetailPage from '../features/orders/OrderDetailPage';

export const router = createBrowserRouter([
    {
        element: <GuestLayout />,
        children: [
            { path: '/login', element: <LoginPage /> },
            { path: '/register', element: <RegisterPage /> },
        ],
    },
    { path: '/auth/callback', element: <OAuthCallbackPage /> },
    { path: '/403', element: <ForbiddenPage /> },
    {
        element: <AppLayout />,
        children: [
            { path: '/courses', element: <CourseListPage /> },
            { path: '/courses/:slug', element: <CourseDetailPage /> },
            {
                path: '/dashboard',
                element: (
                    <RequireAuth>
                        <DashboardPage />
                    </RequireAuth>
                ),
            },
            {
                path: '/my-learning',
                element: (
                    <RequireAuth>
                        <MyLearningPage />
                    </RequireAuth>
                ),
            },
            {
                path: '/learn/:slug',
                element: (
                    <RequireAuth>
                        <CoursePlayerPage />
                    </RequireAuth>
                ),
            },
            {
                path: '/cart',
                element: (
                    <RequireAuth>
                        <CartPage />
                    </RequireAuth>
                ),
            },
            {
                path: '/orders',
                element: (
                    <RequireAuth>
                        <OrdersPage />
                    </RequireAuth>
                ),
            },
            {
                path: '/orders/:orderId',
                element: (
                    <RequireAuth>
                        <OrderDetailPage />
                    </RequireAuth>
                ),
            },
            {
                path: '/instructor/apply',
                element: (
                    <RequireAuth>
                        <ApplyPage />
                    </RequireAuth>
                ),
            },
            {
                path: '/instructor/courses',
                element: (
                    <RequireAuth roles={['instructor']}>
                        <InstructorCoursesPage />
                    </RequireAuth>
                ),
            },
            {
                path: '/instructor/courses/:courseId',
                element: (
                    <RequireAuth roles={['instructor']}>
                        <CourseEditorPage />
                    </RequireAuth>
                ),
            },
            {
                path: '/instructor/dashboard',
                element: (
                    <RequireAuth roles={['instructor']}>
                        <InstructorDashboardPage />
                    </RequireAuth>
                ),
            },
            {
                path: '/admin/instructor-applications',
                element: (
                    <RequireAuth roles={['admin']}>
                        <ApplicationsQueuePage />
                    </RequireAuth>
                ),
            },
            {
                path: '/admin/courses',
                element: (
                    <RequireAuth roles={['admin']}>
                        <CourseModerationPage />
                    </RequireAuth>
                ),
            },
            {
                path: '/admin/payouts',
                element: (
                    <RequireAuth roles={['admin']}>
                        <AdminPayoutsPage />
                    </RequireAuth>
                ),
            },
            {
                path: '/admin/users',
                element: (
                    <RequireAuth roles={['admin']}>
                        <AdminUsersPage />
                    </RequireAuth>
                ),
            },
        ],
    },
    { path: '/', element: <Navigate to="/courses" replace /> },
    { path: '*', element: <NotFoundPage /> },
]);
