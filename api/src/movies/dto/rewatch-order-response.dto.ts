import { ApiProperty } from '@nestjs/swagger';

export class TargetMovieDto {
  @ApiProperty({ example: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6', description: 'Target movie UUID' })
  id: string;

  @ApiProperty({ example: 'Avengers: Doomsday', description: 'Target movie title' })
  title: string;
}

export class RewatchOrderMovieDto {
  @ApiProperty({ example: 'movie-uuid', description: 'Movie UUID' })
  id: string;

  @ApiProperty({ example: 'Iron Man', description: 'Movie title' })
  title: string;

  @ApiProperty({ example: 2008, description: 'Release year' })
  releaseYear: number;

  @ApiProperty({ example: 126, description: 'Runtime in minutes' })
  runtimeMinutes: number;

  @ApiProperty({ example: true, description: 'Watched status' })
  watched: boolean;
}

export class RewatchOrderResponseDto {
  @ApiProperty({ type: TargetMovieDto, description: 'Target movie metadata' })
  targetMovie: TargetMovieDto;

  @ApiProperty({
    type: [RewatchOrderMovieDto],
    description: 'Ordered list of prerequisite movies (prerequisite-first)',
  })
  movies: RewatchOrderMovieDto[];

  @ApiProperty({ example: 1, description: 'Number of prerequisite movies already watched' })
  watchedCount: number;

  @ApiProperty({ example: 7, description: 'Total number of prerequisite movies' })
  totalCount: number;

  @ApiProperty({ example: 6, description: 'Number of prerequisite movies remaining to watch' })
  unwatchedCount: number;

  @ApiProperty({
    example: 900,
    description: 'Sum of runtimeMinutes for prerequisite movies whose watched value is false',
  })
  remainingRuntimeMinutes: number;
}
