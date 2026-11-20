import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: 400, description: 'HTTP status code' })
  statusCode: number;

  @ApiProperty({ example: 'BAD_REQUEST', description: 'Application error code' })
  code: string;

  @ApiProperty({
    example: 'runtimeMinutes must not be greater than 300',
    description: 'Error message or list of validation messages',
  })
  message: string | string[];
}
