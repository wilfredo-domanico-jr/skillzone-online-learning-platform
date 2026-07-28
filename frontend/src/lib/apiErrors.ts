import type { AxiosError } from 'axios';

interface ApiErrorPayload {
    message?: string;
    errors?: Record<string, string[]>;
}

/**
 * Laravel validation failures return 422 with { message, errors: { field: [msg, ...] } }.
 * Flattens that into { field: "first message" } for simple form display.
 */
export function fieldErrors(error: unknown): Record<string, string> {
    const errors = (error as AxiosError<ApiErrorPayload> | undefined)?.response?.data?.errors;

    if (!errors) return {};

    return Object.fromEntries(
        Object.entries(errors).map(([field, messages]) => [field, messages[0]])
    );
}

export function generalError(error: unknown): string {
    return (
        (error as AxiosError<ApiErrorPayload> | undefined)?.response?.data?.message ??
        'Something went wrong. Please try again.'
    );
}
