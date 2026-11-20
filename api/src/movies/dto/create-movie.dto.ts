import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ArrayUnique,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMovieDto {
  @ApiProperty({ example: 'Iron Man', description: 'Movie title' })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  title: string;

  @ApiProperty({ example: 2008, description: 'Release year (positive integer)' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  releaseYear: number;

  @ApiProperty({ example: 126, description: 'Runtime in minutes (1-300)' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(300)
  runtimeMinutes: number;

  @ApiPropertyOptional({
    type: [String],
    example: ['123e4567-e89b-12d3-a456-426614174000'],
    description: 'Prerequisite movie UUIDs',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  prerequisiteIds?: string[];
}
