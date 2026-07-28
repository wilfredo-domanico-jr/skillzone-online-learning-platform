export type Role = 'student' | 'instructor' | 'admin';

export interface UserRole {
    id: number;
    name: Role;
}

export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
    suspended_at?: string | null;
    roles?: UserRole[];
}

export interface Category {
    id: number;
    name: string;
    slug: string;
}

export type CourseLevel = 'beginner' | 'intermediate' | 'advanced' | 'all_levels';
export type CourseStatus = 'draft' | 'pending_review' | 'published' | 'rejected';

export interface Course {
    id: number;
    slug: string;
    title: string;
    subtitle?: string | null;
    description?: string | null;
    price: number | string;
    level?: CourseLevel;
    status: CourseStatus;
    rejection_reason?: string | null;
    average_rating: number | string;
    reviews_count: number;
    published_at?: string | null;
    category?: Category | null;
    instructor?: Pick<User, 'id' | 'name'> | null;
    sections?: CourseSection[];
}

export interface CourseSection {
    id: number;
    title: string;
    position: number;
    lessons: Lesson[];
}

export type LessonType = 'video' | 'article' | 'quiz' | 'resource';

// Matches backend/app/Http/Resources/LessonResource.php — video/article content
// is nested (only present when the requester can view it), and attachments use
// `file_name`, not `name`.
export interface LessonVideo {
    url: string;
    duration_seconds?: number | null;
    captions_url?: string | null;
}

export interface LessonArticle {
    body_html: string;
}

export interface LessonAttachment {
    id: number;
    file_name: string;
    file_size?: number;
    mime_type?: string;
    url: string;
}

export interface Lesson {
    id: number;
    section_id?: number;
    title: string;
    type: LessonType;
    position: number;
    is_previewable?: boolean;
    locked?: boolean;
    duration_seconds?: number | null;
    completed?: boolean;
    last_position_seconds?: number | null;
    video?: LessonVideo | null;
    article?: LessonArticle | null;
    attachments?: LessonAttachment[];
    quiz?: Quiz | null;
}

export interface Enrollment {
    id: number;
    course_id: number;
    user_id: number;
    source: 'free' | 'purchase';
    progress_percent: number;
    completed_at?: string | null;
    course?: Course;
}

// Matches backend/app/Http/Resources/QuizResource.php.
export interface Quiz {
    id: number;
    lesson_id?: number;
    passing_score_percent: number;
    max_attempts: number | null;
    time_limit_minutes?: number | null;
    questions?: QuizQuestion[];
}

export type QuizQuestionType = 'single_choice' | 'multiple_choice' | 'true_false';

export interface QuizAnswer {
    id: number;
    answer_text: string;
    is_correct?: boolean | null;
}

export interface QuizQuestion {
    id: number;
    question_text: string;
    type: QuizQuestionType;
    position: number;
    points: number;
    answers: QuizAnswer[];
}

// Matches backend/app/Http/Resources/QuizAttemptResource.php.
export interface QuizAttemptAnswer {
    question_id: number;
    selected_answer_ids: number[];
    is_correct?: boolean;
    correct_answer_ids?: number[];
}

export interface QuizAttempt {
    id: number;
    quiz_id: number;
    score_percent: number | null;
    passed: boolean | null;
    started_at: string;
    submitted_at: string | null;
    answers?: QuizAttemptAnswer[];
}

export interface Review {
    id: number;
    rating: number;
    comment?: string | null;
    user?: Pick<User, 'id' | 'name'>;
}

export interface CartItem {
    id: number;
    course: Course;
}

export interface Cart {
    id: number;
    items: CartItem[];
    subtotal: number | string;
    total?: number | string;
    coupon?: Coupon | null;
    discount?: number | string;
}

export interface Coupon {
    id: number;
    code: string;
    discount_type: 'percent' | 'fixed';
    discount_value: number | string;
}

export type OrderStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface OrderItem {
    id: number;
    course: Course;
    price_at_purchase: number | string;
}

export interface Order {
    id: number;
    status: OrderStatus;
    subtotal: number | string;
    discount_total: number | string;
    total: number | string;
    currency?: string;
    paid_at?: string | null;
    items: OrderItem[];
    created_at: string;
}

export type InstructorApplicationStatus = 'pending' | 'approved' | 'rejected';

export interface InstructorApplication {
    id: number;
    status: InstructorApplicationStatus;
    bio?: string;
    expertise?: string[] | null;
    portfolio_url?: string | null;
    rejection_reason?: string | null;
    user?: Pick<User, 'id' | 'name' | 'email'>;
    created_at: string;
}

export type PayoutStatus = 'pending' | 'processing' | 'paid';

// Matches backend/app/Http/Resources/PayoutResource.php.
export interface InstructorPayout {
    id: number;
    period_start: string;
    period_end: string;
    gross_amount: number | string;
    platform_fee_amount: number | string;
    net_amount: number | string;
    status: PayoutStatus;
    paid_at?: string | null;
    notes?: string | null;
    instructor?: Pick<User, 'id' | 'name'>;
}

export interface AppNotification {
    id: string;
    read_at: string | null;
    created_at: string;
    data: Record<string, unknown>;
}

export interface NotificationsResponse {
    data: AppNotification[];
    unread_count: number;
    links?: unknown;
    meta?: unknown;
}

export interface PaginationLinks {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
}

export interface PaginationMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    [key: string]: unknown;
}

export interface PaginatedResponse<T> {
    data: T[];
    links: PaginationLinks;
    meta: PaginationMeta;
}
