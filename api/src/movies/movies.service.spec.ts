import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { MoviesService } from './movies.service';
import { PrismaService } from '../prisma/prisma.service';
import { CircularDependencyException } from '../common/exceptions/circular-dependency.exception';

describe('MoviesService', () => {
  let service: MoviesService;
  let prisma: {
    movie: {
      findFirst: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    moviePrerequisite: {
      findMany: jest.Mock;
      deleteMany: jest.Mock;
      createMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      movie: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      moviePrerequisite: {
        findMany: jest.fn(),
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MoviesService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<MoviesService>(MoviesService);
  });

  describe('create', () => {
    it('should create a movie with default watched=false and return prerequisites', async () => {
      prisma.movie.findFirst.mockResolvedValue(null);
      prisma.movie.create.mockResolvedValue({
        id: 'movie-1',
        title: 'Iron Man',
        releaseYear: 2008,
        runtimeMinutes: 126,
        watched: false,
        prerequisites: [],
      });

      const result = await service.create({
        title: 'Iron Man',
        releaseYear: 2008,
        runtimeMinutes: 126,
      });

      expect(result.id).toBe('movie-1');
      expect(result.watched).toBe(false);
      expect(result.prerequisites).toEqual([]);
      expect(prisma.movie.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'Iron Man',
            watched: false,
          }),
        }),
      );
    });

    it('should reject creating a movie with a duplicate title', async () => {
      prisma.movie.findFirst.mockResolvedValue({ id: 'existing', title: 'Iron Man' });

      await expect(
        service.create({
          title: 'Iron Man',
          releaseYear: 2008,
          runtimeMinutes: 126,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should reject creating a movie with unknown prerequisite IDs', async () => {
      prisma.movie.findFirst.mockResolvedValue(null);
      prisma.movie.findMany.mockResolvedValue([{ id: 'known-id' }]); // only 1 found, but 2 requested

      await expect(
        service.create({
          title: 'The Avengers',
          releaseYear: 2012,
          runtimeMinutes: 143,
          prerequisiteIds: ['known-id', 'unknown-id'],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll and findOne', () => {
    it('should list all movies with prerequisite IDs', async () => {
      prisma.movie.findMany.mockResolvedValue([
        {
          id: 'm1',
          title: 'Iron Man',
          releaseYear: 2008,
          prerequisites: [],
        },
      ]);

      const result = await service.findAll();
      expect(result.length).toBe(1);
      expect(result[0].prerequisites).toEqual([]);
    });

    it('should throw NotFoundException if movie does not exist', async () => {
      prisma.movie.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update movie attributes and watched flag', async () => {
      prisma.movie.findUnique.mockResolvedValue({
        id: 'm1',
        title: 'Iron Man',
        releaseYear: 2008,
        runtimeMinutes: 126,
        watched: false,
        prerequisites: [],
      });
      prisma.movie.update.mockResolvedValue({
        id: 'm1',
        title: 'Iron Man',
        releaseYear: 2008,
        runtimeMinutes: 126,
        watched: true,
        prerequisites: [],
      });

      const result = await service.update('m1', { watched: true });
      expect(result.watched).toBe(true);
    });

    it('should reject update if title is taken by another movie', async () => {
      prisma.movie.findUnique.mockResolvedValue({
        id: 'm1',
        title: 'Iron Man',
        prerequisites: [],
      });
      prisma.movie.findFirst.mockResolvedValue({
        id: 'm2',
        title: 'Thor',
      });

      await expect(service.update('m1', { title: 'Thor' })).rejects.toThrow(ConflictException);
    });

    it('should reject direct self-dependency with CircularDependencyException', async () => {
      prisma.movie.findUnique.mockResolvedValue({
        id: 'm1',
        title: 'Iron Man',
        prerequisites: [],
      });

      await expect(service.update('m1', { prerequisiteIds: ['m1'] })).rejects.toThrow(
        CircularDependencyException,
      );
    });

    it('should reject indirect circular dependency with CircularDependencyException', async () => {
      prisma.movie.findUnique.mockResolvedValue({
        id: 'iron-man',
        title: 'Iron Man',
        prerequisites: [],
      });
      prisma.movie.findMany.mockResolvedValue([{ id: 'endgame' }]); // found prerequisite

      // Existing graph: endgame -> infinity-war -> avengers -> iron-man
      prisma.moviePrerequisite.findMany.mockResolvedValue([
        { movieId: 'endgame', prerequisiteId: 'infinity-war' },
        { movieId: 'infinity-war', prerequisiteId: 'avengers' },
        { movieId: 'avengers', prerequisiteId: 'iron-man' },
      ]);

      await expect(
        service.update('iron-man', { prerequisiteIds: ['endgame'] }),
      ).rejects.toThrow(CircularDependencyException);
    });

    it('should replace prerequisites atomically inside transaction', async () => {
      prisma.movie.findUnique.mockResolvedValue({
        id: 'avengers',
        title: 'The Avengers',
        prerequisites: [{ prerequisiteId: 'first-avenger' }],
      });
      prisma.movie.findMany.mockResolvedValue([{ id: 'iron-man' }]);
      prisma.moviePrerequisite.findMany.mockResolvedValue([]);
      prisma.movie.update.mockResolvedValue({
        id: 'avengers',
        title: 'The Avengers',
        prerequisites: [{ prerequisiteId: 'iron-man' }],
      });

      const result = await service.update('avengers', { prerequisiteIds: ['iron-man'] });

      expect(prisma.moviePrerequisite.deleteMany).toHaveBeenCalledWith({
        where: { movieId: 'avengers' },
      });
      expect(prisma.moviePrerequisite.createMany).toHaveBeenCalledWith({
        data: [{ movieId: 'avengers', prerequisiteId: 'iron-man' }],
      });
      expect(result.prerequisites).toEqual(['iron-man']);
    });
  });

  describe('getRewatchOrder', () => {
    it('should calculate valid prerequisite-first order and exclude target movie', async () => {
      prisma.movie.findUnique.mockResolvedValue({ id: 'm3', title: 'The Avengers' });
      prisma.movie.findMany.mockResolvedValue([
        { id: 'm1', title: 'Iron Man', releaseYear: 2008, runtimeMinutes: 126, watched: true },
        { id: 'm2', title: 'Captain America: The First Avenger', releaseYear: 2011, runtimeMinutes: 124, watched: false },
        { id: 'm3', title: 'The Avengers', releaseYear: 2012, runtimeMinutes: 143, watched: false },
      ]);
      prisma.moviePrerequisite.findMany.mockResolvedValue([
        { movieId: 'm3', prerequisiteId: 'm1' },
        { movieId: 'm3', prerequisiteId: 'm2' },
      ]);

      const result = await service.getRewatchOrder('m3');

      expect(result.targetMovie.title).toBe('The Avengers');
      expect(result.totalCount).toBe(2);
      expect(result.watchedCount).toBe(1);
      expect(result.unwatchedCount).toBe(1);
      expect(result.remainingRuntimeMinutes).toBe(124);
      expect(result.movies.map((m) => m.title)).not.toContain('The Avengers');
    });

    it('should throw NotFoundException if target movie does not exist', async () => {
      prisma.movie.findUnique.mockResolvedValue(null);

      await expect(service.getRewatchOrder('unknown-id')).rejects.toThrow(NotFoundException);
    });
  });
});
