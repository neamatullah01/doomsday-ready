import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCodes } from '../constants/error-codes';

export class CircularDependencyException extends HttpException {
  constructor(message = 'The prerequisite relationship would create a circular dependency.') {
    super(
      {
        statusCode: HttpStatus.CONFLICT,
        code: ErrorCodes.CIRCULAR_DEPENDENCY,
        message,
      },
      HttpStatus.CONFLICT,
    );
  }
}
