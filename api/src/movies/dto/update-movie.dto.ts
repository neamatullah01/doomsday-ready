import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ArrayUnique,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMovieDto {
  @ApiPropertyOptional({ example: 'Iron Man', description: 'Movie title' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  title?: string;

  @ApiPropertyOptional({ example: 2008, description: 'Release year (positive integer)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  releaseYear?: number;

  @ApiPropertyOptional({ example: 126, description: 'Runtime in minutes (1-300)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(300)
  runtimeMinutes?: number;

  @ApiPropertyOptional({ example: true, description: 'Watched status' })
  @IsOptional()
  @IsBoolean()
  watched?: boolean;

  @ApiPropertyOptional({
    type: [String],
    example: ['123e4567-e89b-12d3-a456-426614174000'],
    description: 'New prerequisite movie UUIDs (replaces existing list)',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  prerequisiteIds?: string[];
}
