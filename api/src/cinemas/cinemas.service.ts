import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCinemaDto } from './dto/create-cinema.dto';
import { computeMinimumBundles } from './algorithms/minimum-bundles';
import { BookingResponseDto } from './dto/booking-response.dto';

@Injectable()
export class CinemasService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCinemaDto) {
    const existing = await this.prisma.cinema.findFirst({
      where: {
        name: { equals: dto.name, mode: 'insensitive' },
      },
    });

    if (existing) {
      throw new ConflictException(`Cinema with name "${dto.name}" already exists.`);
    }

    const uniqueSortedSizes = Array.from(new Set(dto.bundleSizes)).sort((a, b) => a - b);

    try {
      return await this.prisma.cinema.create({
        data: {
          name: dto.name,
          bundleSizes: uniqueSortedSizes,
        },
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictException(`Cinema with name "${dto.name}" already exists.`);
      }
      throw error;
    }
  }

  async findAll() {
    return this.prisma.cinema.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const cinema = await this.prisma.cinema.findUnique({
      where: { id },
    });

    if (!cinema) {
      throw new NotFoundException(`Cinema with ID ${id} not found.`);
    }

    return cinema;
  }

  async getBookingQuote(cinemaId: string, groupSize: number): Promise<BookingResponseDto> {
    const cinema = await this.findOne(cinemaId);

    const result = computeMinimumBundles(cinema.bundleSizes, groupSize);

    return {
      cinema: {
        id: cinema.id,
        name: cinema.name,
        bundleSizes: cinema.bundleSizes,
      },
      groupSize,
      possible: result.possible,
      totalBundles: result.totalBundles,
      bundles: result.bundles,
      totalSeats: result.totalSeats,
    };
  }
}
