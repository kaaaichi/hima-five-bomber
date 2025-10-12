/**
 * Common type definitions
 */

/**
 * Generic Result type for error handling
 * Represents either a successful result with a value or a failed result with an error
 */
export type Result<T, E> =
  | { success: true; value: T }
  | { success: false; error: E };

/**
 * Repository error types
 */
export type RepositoryError =
  | { type: 'ConnectionError'; message: string }
  | { type: 'ValidationError'; message: string }
  | { type: 'NotFoundError'; id: string };
