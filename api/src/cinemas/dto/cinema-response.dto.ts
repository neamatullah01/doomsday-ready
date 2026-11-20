import { ApiProperty } from '@nestjs/swagger';

export class CinemaResponseDto {
  @ApiProperty({ example: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6', description: 'Cinema UUID' })
  id: string;

  @ApiProperty({ example: 'Cinema A', description: 'Cinema name' })
  name: string;

  @ApiProperty({
    type: [Number],
    example: [2, 5],
    description: 'Distinct bundle seat sizes in ascending order',
  })
  bundleSizes: number[];

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z', description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z', description: 'Last update timestamp' })
  updatedAt: Date;
}
