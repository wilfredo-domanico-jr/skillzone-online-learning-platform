import type { ComponentType } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import GuestLayout from './layouts/GuestLayout';
import AppLayout from './layouts/AppLayout';
import RequireAuth from './RequireAuth';
import RequireGuest from './RequireGuest';
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
import type { Role } from '../types/api';

function protectedRoute(path: string, Component: ComponentType, roles?: Role[]): RouteObject {
    return {
        path,
        element: (
            <RequireAuth roles={roles}>
                <Component />
            </RequireAuth>
        ),
    };
}

export const router = createBrowserRouter([
    {
        element: <GuestLayout />,
        children: [
            {
                path: '/login',
                element: (
                    <RequireGuest>
                        <LoginPage />
                    </RequireGuest>
                ),
            },
            {
                path: '/register',
                element: (
                    <RequireGuest>
                        <RegisterPage />
                    </RequireGuest>
                ),
            },
        ],
    },
    { path: '/auth/callback', element: <OAuthCallbackPage /> },
    { path: '/403', element: <ForbiddenPage /> },
    {
        element: <AppLayout />,
        children: [
            { path: '/courses', element: <CourseListPage /> },
            { path: '/courses/:slug', element: <CourseDetailPage /> },
            protectedRoute('/dashboard', DashboardPage),
            protectedRoute('/my-learning', MyLearningPage),
            protectedRoute('/learn/:slug', CoursePlayerPage),
            protectedRoute('/cart', CartPage),
            protectedRoute('/orders', OrdersPage),
            protectedRoute('/orders/:orderId', OrderDetailPage),
            protectedRoute('/instructor/apply', ApplyPage),
            protectedRoute('/instructor/courses', InstructorCoursesPage, ['instructor']),
            protectedRoute('/instructor/courses/:courseId', CourseEditorPage, ['instructor']),
            protectedRoute('/instructor/dashboard', InstructorDashboardPage, ['instructor']),
            protectedRoute('/admin/instructor-applications', ApplicationsQueuePage, ['admin']),
            protectedRoute('/admin/courses', CourseModerationPage, ['admin']),
            protectedRoute('/admin/payouts', AdminPayoutsPage, ['admin']),
            protectedRoute('/admin/users', AdminUsersPage, ['admin']),
        ],
    },
    { path: '/', element: <Navigate to="/courses" replace /> },
    { path: '*', element: <NotFoundPage /> },
]);
