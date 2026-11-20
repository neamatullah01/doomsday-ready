import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCinemaDto } from './dto/create-cinema.dto';

@Injectable()
export class CinemasService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCinemaDto) {
    const sortedBundleSizes = [...dto.bundleSizes].sort((a, b) => a - b);

    return this.prisma.cinema.create({
      data: {
        name: dto.name,
        bundleSizes: sortedBundleSizes,
      },
    });
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
}
