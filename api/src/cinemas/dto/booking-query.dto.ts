import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BookingQueryDto {
  @ApiProperty({ example: 11, description: 'Group size (integer 1-10000)' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10000)
  groupSize: number;
}
