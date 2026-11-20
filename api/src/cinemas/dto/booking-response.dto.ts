import { ApiProperty } from '@nestjs/swagger';

export class CinemaSummaryDto {
  @ApiProperty({
    example: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6',
    description: 'Cinema UUID',
  })
  id: string;

  @ApiProperty({
    example: 'Cinema A',
    description: 'Cinema name',
  })
  name: string;

  @ApiProperty({
    type: [Number],
    example: [2, 5],
    description: 'Available seat bundle sizes',
  })
  bundleSizes: number[];
}

export class BundleAllocationDto {
  @ApiProperty({
    example: 5,
    description: 'Seat bundle size',
  })
  size: number;

  @ApiProperty({
    example: 1,
    description: 'Quantity of this bundle to reserve',
  })
  quantity: number;
}

export class BookingResponseDto {
  @ApiProperty({
    type: CinemaSummaryDto,
    description: 'Cinema where the watch party is being booked',
  })
  cinema: CinemaSummaryDto;

  @ApiProperty({
    example: 11,
    description: 'Requested party group size',
  })
  groupSize: number;

  @ApiProperty({
    example: true,
    description: 'Whether an exact seat bundle combination exists',
  })
  possible: boolean;

  @ApiProperty({
    example: 4,
    nullable: true,
    description: 'Minimum total number of bundles required (null if not possible)',
  })
  totalBundles: number | null;

  @ApiProperty({
    type: [BundleAllocationDto],
    description: 'Optimal bundle breakdown sorted descending by bundle size',
  })
  bundles: BundleAllocationDto[];

  @ApiProperty({
    example: 11,
    nullable: true,
    description: 'Total seats provided across all bundles (null if not possible)',
  })
  totalSeats: number | null;
}
