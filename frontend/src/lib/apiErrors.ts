import type { AxiosError } from 'axios';
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';

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

/**
 * Applies a failed submission's server errors to a react-hook-form form:
 * field-level validation errors go on their matching field, anything else
 * (auth failure, 500, network error) goes on `root`.
 */
export function applyServerErrors<T extends FieldValues>(error: unknown, setError: UseFormSetError<T>): void {
    const fieldErrs = fieldErrors(error);

    if (Object.keys(fieldErrs).length) {
        Object.entries(fieldErrs).forEach(([field, message]) =>
            setError(field as Path<T>, { message })
        );
    } else {
        setError('root' as Path<T>, { message: generalError(error) });
    }
}
