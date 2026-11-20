import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ example: 'ok', description: 'Health status' })
  status: string;

  @ApiProperty({ example: '2026-11-20T14:30:00.000Z', description: 'Current ISO timestamp' })
  timestamp: string;
}
