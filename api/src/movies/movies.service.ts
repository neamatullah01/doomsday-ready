import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { wouldCreateCycle } from './algorithms/dependency-graph';
import { CircularDependencyException } from '../common/exceptions/circular-dependency.exception';

@Injectable()
export class MoviesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMovieDto) {
    const { title, releaseYear, runtimeMinutes, prerequisiteIds = [] } = dto;

    // Check unique title case-insensitively
    const existing = await this.prisma.movie.findFirst({
      where: {
        title: {
          equals: title,
          mode: 'insensitive',
        },
      },
    });

    if (existing) {
      throw new ConflictException(`A movie with title "${title}" already exists.`);
    }

    // Verify all prerequisite IDs exist
    if (prerequisiteIds.length > 0) {
      const found = await this.prisma.movie.findMany({
        where: { id: { in: prerequisiteIds } },
        select: { id: true },
      });

      if (found.length !== prerequisiteIds.length) {
        throw new BadRequestException('One or more prerequisite movie IDs do not exist.');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const movie = await tx.movie.create({
        data: {
          title,
          releaseYear,
          runtimeMinutes,
          watched: false,
          prerequisites: {
            create: prerequisiteIds.map((prereqId) => ({
              prerequisiteId: prereqId,
            })),
          },
        },
        include: {
          prerequisites: {
            select: {
              prerequisiteId: true,
            },
          },
        },
      });

      return {
        ...movie,
        prerequisites: movie.prerequisites.map((p) => p.prerequisiteId),
      };
    });
  }

  async findAll() {
    const movies = await this.prisma.movie.findMany({
      orderBy: { releaseYear: 'asc' },
      include: {
        prerequisites: {
          select: {
            prerequisiteId: true,
          },
        },
      },
    });

    return movies.map((movie) => ({
      ...movie,
      prerequisites: movie.prerequisites.map((p) => p.prerequisiteId),
    }));
  }

  async findOne(id: string) {
    const movie = await this.prisma.movie.findUnique({
      where: { id },
      include: {
        prerequisites: {
          select: {
            prerequisiteId: true,
          },
        },
      },
    });

    if (!movie) {
      throw new NotFoundException(`Movie with ID ${id} not found.`);
    }

    return {
      ...movie,
      prerequisites: movie.prerequisites.map((p) => p.prerequisiteId),
    };
  }

  async update(id: string, dto: UpdateMovieDto) {
    const current = await this.findOne(id);

    // If title is changing, check uniqueness
    if (dto.title && dto.title.toLowerCase() !== current.title.toLowerCase()) {
      const duplicate = await this.prisma.movie.findFirst({
        where: {
          title: { equals: dto.title, mode: 'insensitive' },
          NOT: { id },
        },
      });

      if (duplicate) {
        throw new ConflictException(`A movie with title "${dto.title}" already exists.`);
      }
    }

    // Validate prerequisites if specified
    if (dto.prerequisiteIds !== undefined) {
      // 1. Check self-dependency
      if (dto.prerequisiteIds.includes(id)) {
        throw new CircularDependencyException('A movie cannot depend on itself.');
      }

      // 2. Validate all prerequisite IDs exist
      if (dto.prerequisiteIds.length > 0) {
        const found = await this.prisma.movie.findMany({
          where: { id: { in: dto.prerequisiteIds } },
          select: { id: true },
        });

        if (found.length !== dto.prerequisiteIds.length) {
          throw new BadRequestException('One or more prerequisite movie IDs do not exist.');
        }
      }

      // 3. Cycle detection against current full relationship graph
      const allRelations = await this.prisma.moviePrerequisite.findMany();
      const graph = new Map<string, string[]>();
      for (const rel of allRelations) {
        const list = graph.get(rel.movieId) || [];
        list.push(rel.prerequisiteId);
        graph.set(rel.movieId, list);
      }

      if (wouldCreateCycle(graph, id, dto.prerequisiteIds)) {
        throw new CircularDependencyException(
          'The prerequisite relationship would create a circular dependency.',
        );
      }
    }

    // Perform atomic update inside transaction
    return this.prisma.$transaction(async (tx) => {
      if (dto.prerequisiteIds !== undefined) {
        await tx.moviePrerequisite.deleteMany({
          where: { movieId: id },
        });

        if (dto.prerequisiteIds.length > 0) {
          await tx.moviePrerequisite.createMany({
            data: dto.prerequisiteIds.map((prereqId) => ({
              movieId: id,
              prerequisiteId: prereqId,
            })),
          });
        }
      }

      const updated = await tx.movie.update({
        where: { id },
        data: {
          ...(dto.title !== undefined && { title: dto.title }),
          ...(dto.releaseYear !== undefined && { releaseYear: dto.releaseYear }),
          ...(dto.runtimeMinutes !== undefined && { runtimeMinutes: dto.runtimeMinutes }),
          ...(dto.watched !== undefined && { watched: dto.watched }),
        },
        include: {
          prerequisites: {
            select: {
              prerequisiteId: true,
            },
          },
        },
      });

      return {
        ...updated,
        prerequisites: updated.prerequisites.map((p) => p.prerequisiteId),
      };
    });
  }
}
