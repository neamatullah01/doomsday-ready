export const ErrorCodes = {
  CIRCULAR_DEPENDENCY: 'CIRCULAR_DEPENDENCY',
  BAD_REQUEST: 'BAD_REQUEST',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes] | string;

export interface ApiErrorResponse {
  statusCode: number;
  code: ErrorCode;
  message: string | string[];
}

export class ApiClientError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details: string | string[];

  constructor(errorResponse: ApiErrorResponse) {
    const formattedMessage = Array.isArray(errorResponse.message)
      ? errorResponse.message.join(', ')
      : errorResponse.message || 'An unexpected error occurred';
    super(formattedMessage);
    this.name = 'ApiClientError';
    this.statusCode = errorResponse.statusCode;
    this.code = errorResponse.code;
    this.details = errorResponse.message;
  }
}
