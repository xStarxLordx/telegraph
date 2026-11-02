// Error codes: services throw ServiceError with one of them; the UI translates the code.
import type { ErrorCode } from '../domain/errors';
import type { UiErrorCode } from '../i18n/errorKey';

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];

/** Codes of form rules that only exist in the UI. */
export type UiErrorCodeValue = (typeof UiErrorCode)[keyof typeof UiErrorCode];

/** Any code the UI knows how to translate. */
export type AppErrorCode = ErrorCodeValue | UiErrorCodeValue;

export interface ServiceErrorOptions {
  /** The form field the error belongs to. */
  field?: string;
  /** The original provider error, kept for debugging (the UI ignores it). */
  cause?: unknown;
}

/** A validator's verdict: an error code, or null when the value is valid. */
export type ValidationResult = ErrorCodeValue | null;
