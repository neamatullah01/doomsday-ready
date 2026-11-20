import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ErrorCodes } from '../constants/error-codes';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let code: string = ErrorCodes.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resObj = exceptionResponse as Record<string, any>;
        code = resObj.code ?? this.getDefaultCode(statusCode);
        message = resObj.message ?? exception.message;
      } else {
        message = exceptionResponse;
        code = this.getDefaultCode(statusCode);
      }
    } else if (this.isPrismaError(exception)) {
      const prismaErr = exception as { code?: string; meta?: { target?: string[] } };
      if (prismaErr.code === 'P2002') {
        statusCode = HttpStatus.CONFLICT;
        code = ErrorCodes.CONFLICT;
        const target = prismaErr.meta?.target ? prismaErr.meta.target.join(', ') : 'field';
        message = `A record with this ${target} already exists.`;
      } else if (prismaErr.code === 'P2025') {
        statusCode = HttpStatus.NOT_FOUND;
        code = ErrorCodes.NOT_FOUND;
        message = 'Record not found.';
      } else {
        this.logger.error('Database error:', exception);
      }
    } else {
      this.logger.error('Unexpected error:', exception);
    }

    response.status(statusCode).json({
      statusCode,
      code,
      message,
    });
  }

  private isPrismaError(err: unknown): boolean {
    return (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      typeof (err as any).code === 'string' &&
      (err as any).code.startsWith('P')
    );
  }

  private getDefaultCode(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return ErrorCodes.BAD_REQUEST;
      case HttpStatus.NOT_FOUND:
        return ErrorCodes.NOT_FOUND;
      case HttpStatus.CONFLICT:
        return ErrorCodes.CONFLICT;
      default:
        return ErrorCodes.INTERNAL_SERVER_ERROR;
    }
  }
}
