// Matches the backend default for quizzes.passing_score_percent (see the
// quiz builder's settings form, which falls back to this before a quiz exists).
export const DEFAULT_PASSING_SCORE_PERCENT = 70;

// How often the video player autosaves resume position while playing.
export const VIDEO_PROGRESS_SAVE_INTERVAL_SECONDS = 5;

// How often the notification bell polls for new notifications.
export const NOTIFICATION_POLL_INTERVAL_MS = 30_000;

// How often an order detail page polls while waiting for the Stripe webhook
// to flip a pending order to paid.
export const ORDER_POLL_INTERVAL_MS = 2_000;
