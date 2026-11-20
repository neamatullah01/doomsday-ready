import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { MoviesController } from './movies.controller';
import { MoviesService } from './movies.service';
import { PrismaService } from '../prisma/prisma.service';
import { CircularDependencyException } from '../common/exceptions/circular-dependency.exception';

describe('MoviesController & MoviesService Integration', () => {
  let controller: MoviesController;

  const moviesDb = new Map<string, any>();
  const prereqsDb: Array<{ movieId: string; prerequisiteId: string }> = [];

  const mockPrismaService = {
    movie: {
      findFirst: jest.fn(async ({ where }) => {
        for (const movie of moviesDb.values()) {
          if (where.title?.equals && movie.title.toLowerCase() === where.title.equals.toLowerCase()) {
            if (where.NOT?.id && movie.id === where.NOT.id) continue;
            return movie;
          }
        }
        return null;
      }),
      findMany: jest.fn(async (params) => {
        if (params?.where?.id?.in) {
          const ids: string[] = params.where.id.in;
          return ids.filter((id) => moviesDb.has(id)).map((id) => ({ id }));
        }
        return Array.from(moviesDb.values()).map((m) => ({
          ...m,
          prerequisites: prereqsDb.filter((p) => p.movieId === m.id),
        }));
      }),
      findUnique: jest.fn(async ({ where }) => {
        const movie = moviesDb.get(where.id);
        if (!movie) return null;
        return {
          ...movie,
          prerequisites: prereqsDb.filter((p) => p.movieId === where.id),
        };
      }),
      create: jest.fn(async ({ data }) => {
        const id = `11111111-1111-4111-a111-${String(moviesDb.size + 1).padStart(12, '0')}`;
        const movie = {
          id,
          title: data.title,
          releaseYear: data.releaseYear,
          runtimeMinutes: data.runtimeMinutes,
          watched: data.watched ?? false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        moviesDb.set(id, movie);
        if (data.prerequisites?.create) {
          for (const item of data.prerequisites.create) {
            prereqsDb.push({ movieId: id, prerequisiteId: item.prerequisiteId });
          }
        }
        return {
          ...movie,
          prerequisites: prereqsDb.filter((p) => p.movieId === id),
        };
      }),
      update: jest.fn(async ({ where, data }) => {
        const current = moviesDb.get(where.id);
        const updated = {
          ...current,
          ...data,
          updatedAt: new Date(),
        };
        moviesDb.set(where.id, updated);
        return {
          ...updated,
          prerequisites: prereqsDb.filter((p) => p.movieId === where.id),
        };
      }),
    },
    moviePrerequisite: {
      findMany: jest.fn(async () => prereqsDb),
      deleteMany: jest.fn(async ({ where }) => {
        const remaining = prereqsDb.filter((p) => p.movieId !== where.movieId);
        prereqsDb.length = 0;
        prereqsDb.push(...remaining);
      }),
      createMany: jest.fn(async ({ data }) => {
        prereqsDb.push(...data);
      }),
    },
    $transaction: jest.fn(async (cb) => cb(mockPrismaService)),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MoviesController],
      providers: [
        MoviesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    controller = module.get<MoviesController>(MoviesController);
  });

  beforeEach(() => {
    moviesDb.clear();
    prereqsDb.length = 0;
  });

  it('should create a valid movie and return it with watched=false and empty prerequisites', async () => {
    const movie = await controller.create({
      title: 'Iron Man',
      releaseYear: 2008,
      runtimeMinutes: 126,
    });

    expect(movie).toHaveProperty('id');
    expect(movie.title).toBe('Iron Man');
    expect(movie.releaseYear).toBe(2008);
    expect(movie.runtimeMinutes).toBe(126);
    expect(movie.watched).toBe(false);
    expect(movie.prerequisites).toEqual([]);
  });

  it('should reject creating duplicate movie titles with ConflictException', async () => {
    await controller.create({
      title: 'Iron Man',
      releaseYear: 2008,
      runtimeMinutes: 126,
    });

    await expect(
      controller.create({
        title: 'Iron Man',
        releaseYear: 2008,
        runtimeMinutes: 126,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('should reject creating a movie with non-existent prerequisite IDs', async () => {
    await expect(
      controller.create({
        title: 'The Avengers',
        releaseYear: 2012,
        runtimeMinutes: 143,
        prerequisiteIds: ['00000000-0000-0000-0000-000000000000'],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should create movie with valid prerequisites and list all movies', async () => {
    const ironMan = await controller.create({
      title: 'Iron Man',
      releaseYear: 2008,
      runtimeMinutes: 126,
    });

    const cap = await controller.create({
      title: 'Captain America: The First Avenger',
      releaseYear: 2011,
      runtimeMinutes: 124,
    });

    const avengers = await controller.create({
      title: 'The Avengers',
      releaseYear: 2012,
      runtimeMinutes: 143,
      prerequisiteIds: [ironMan.id, cap.id],
    });

    expect(avengers.prerequisites).toEqual([ironMan.id, cap.id]);

    const list = await controller.findAll();
    expect(list.length).toBe(3);
  });

  it('should update movie watched status', async () => {
    const ironMan = await controller.create({
      title: 'Iron Man',
      releaseYear: 2008,
      runtimeMinutes: 126,
    });

    const updated = await controller.update(ironMan.id, { watched: true });
    expect(updated.watched).toBe(true);
  });

  it('should reject direct self-dependency with CircularDependencyException (409)', async () => {
    const ironMan = await controller.create({
      title: 'Iron Man',
      releaseYear: 2008,
      runtimeMinutes: 126,
    });

    await expect(
      controller.update(ironMan.id, { prerequisiteIds: [ironMan.id] }),
    ).rejects.toThrow(CircularDependencyException);
  });

  it('should reject indirect circular dependency with CircularDependencyException (409)', async () => {
    const ironMan = await controller.create({
      title: 'Iron Man',
      releaseYear: 2008,
      runtimeMinutes: 126,
    });

    const avengers = await controller.create({
      title: 'The Avengers',
      releaseYear: 2012,
      runtimeMinutes: 143,
      prerequisiteIds: [ironMan.id],
    });

    // Proposing ironMan -> avengers creates ironMan -> avengers -> ironMan
    await expect(
      controller.update(ironMan.id, { prerequisiteIds: [avengers.id] }),
    ).rejects.toThrow(CircularDependencyException);
  });

  it('should throw NotFoundException when updating non-existent movie', async () => {
    await expect(
      controller.update('00000000-0000-0000-0000-000000000000', { watched: true }),
    ).rejects.toThrow(NotFoundException);
  });
});
