import { ApiProperty } from '@nestjs/swagger';

export class MovieResponseDto {
  @ApiProperty({ example: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6', description: 'Movie UUID' })
  id: string;

  @ApiProperty({ example: 'Iron Man', description: 'Movie title' })
  title: string;

  @ApiProperty({ example: 2008, description: 'Release year' })
  releaseYear: number;

  @ApiProperty({ example: 126, description: 'Runtime in minutes' })
  runtimeMinutes: number;

  @ApiProperty({ example: false, description: 'Watched status' })
  watched: boolean;

  @ApiProperty({
    type: [String],
    example: ['123e4567-e89b-12d3-a456-426614174000'],
    description: 'List of prerequisite movie UUIDs',
  })
  prerequisites: string[];

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z', description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z', description: 'Last update timestamp' })
  updatedAt: Date;
}
