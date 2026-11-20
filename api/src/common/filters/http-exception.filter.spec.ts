import { HttpStatus, BadRequestException } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';
import { CircularDependencyException } from '../exceptions/circular-dependency.exception';
import { ErrorCodes } from '../constants/error-codes';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockResponse: any;
  let mockHost: any;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => mockResponse,
      }),
    };
  });

  it('should format standard HttpException with status and message', () => {
    const exception = new BadRequestException('Invalid group size');

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      code: ErrorCodes.BAD_REQUEST,
      message: 'Invalid group size',
    });
  });

  it('should format CircularDependencyException with status 409 and CIRCULAR_DEPENDENCY code', () => {
    const exception = new CircularDependencyException();

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.CONFLICT,
      code: 'CIRCULAR_DEPENDENCY',
      message: 'The prerequisite relationship would create a circular dependency.',
    });
  });

  it('should format Prisma P2002 unique constraint error as 409 Conflict', () => {
    const prismaError = {
      code: 'P2002',
      meta: { target: ['title'] },
    };

    filter.catch(prismaError, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.CONFLICT,
      code: ErrorCodes.CONFLICT,
      message: 'A record with this title already exists.',
    });
  });

  it('should format unexpected exceptions as 500 without leaking details', () => {
    const error = new Error('Unexpected database failure');

    filter.catch(error, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: ErrorCodes.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    });
  });
});
