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
  | { type: 'NotFoundError'; message: string }
  | { type: 'S3Error'; message: string }
  | { type: 'ParseError'; message: string };

/**
 * Service error types
 */
export type ServiceError =
  | { type: 'ValidationError'; message: string }
  | { type: 'DatabaseError'; message: string }
  | { type: 'NotFoundError'; message: string };
