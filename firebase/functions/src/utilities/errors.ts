import {FunctionsErrorCode, HttpsError} from "firebase-functions/v2/https";

/**
 * Custom error class that extends the HttpsError class.
 */
export class AppendableHttpsError extends HttpsError {
  /**
   * Constructs an instance of AppendableHttpsError.
   *
   * @param {FunctionsErrorCode} code - The error code.
   * @param {string} message - The error message.
   * @param {unknown} [details] - Additional details about the error.
   */
  constructor(code: FunctionsErrorCode, message: string, details?: unknown) {
    super(code, message, details);
    this.name = "AppendableHttpsError";
  }
  /**
   * Appends a suffix to the error message and returns a
   *  new instance of AppendableHttpsError.
   *
   * @param {string} suffix - The suffix to append.
   * @return {AppendableHttpsError} - A new instance of AppendableHttpsError
   *  with the appended message.
   */
  append(suffix: string) {
    return new AppendableHttpsError(
      this.code, this.message + ` : ${suffix}`, this.details);
  }
}

export const UnknownError = "unknown error";

export const NotAuthenticatedError =
  new AppendableHttpsError("unauthenticated", "not authenticated");

export const InvalidOwnerError =
  new AppendableHttpsError("permission-denied", "invalid owner");

export const documentNotFoundError =
  (id: string) =>
    new AppendableHttpsError("not-found", `document not found: ${id}`);

export const fieldMustBeStringError =
  (field: string) =>
    new AppendableHttpsError("invalid-argument", `${field} must be a string`);

export const InvalidArgumentError =
  new AppendableHttpsError("invalid-argument", "incorrectly formatted object");

export const AlreadyAssignedError =
  new AppendableHttpsError("invalid-argument", "already assigned");

export const InvalidRoleError =
  new AppendableHttpsError("unauthenticated", "invalid role");

export const internalError =
  (msg: string) =>
    new AppendableHttpsError("internal", "internal error", msg);

export const docNotParsableError =
  (error: Error) =>
    new AppendableHttpsError("internal", "document not parsable", error);

export const HttpErrorCodes: Record<FunctionsErrorCode, number> = {
  "ok": 200,
  "cancelled": 499,
  "unknown": 500,
  "invalid-argument": 400,
  "deadline-exceeded": 504,
  "not-found": 404,
  "already-exists": 409,
  "permission-denied": 403,
  "resource-exhausted": 429,
  "failed-precondition": 400,
  "aborted": 409,
  "out-of-range": 400,
  "unimplemented": 501,
  "internal": 500,
  "unavailable": 503,
  "data-loss": 500,
  "unauthenticated": 401,
};
