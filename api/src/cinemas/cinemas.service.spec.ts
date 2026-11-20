import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CinemasService } from './cinemas.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CinemasService', () => {
  let service: CinemasService;
  let prisma: {
    cinema: {
      findFirst: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      cinema: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CinemasService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<CinemasService>(CinemasService);
  });

  describe('create', () => {
    it('creates a cinema with sorted, deduplicated bundleSizes', async () => {
      prisma.cinema.findFirst.mockResolvedValue(null);
      const createdRecord = {
        id: 'uuid-1',
        name: 'Cinema A',
        bundleSizes: [2, 5],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prisma.cinema.create.mockResolvedValue(createdRecord);

      const result = await service.create({
        name: 'Cinema A',
        bundleSizes: [5, 2, 5],
      });

      expect(prisma.cinema.findFirst).toHaveBeenCalledWith({
        where: { name: { equals: 'Cinema A', mode: 'insensitive' } },
      });
      expect(prisma.cinema.create).toHaveBeenCalledWith({
        data: {
          name: 'Cinema A',
          bundleSizes: [2, 5],
        },
      });
      expect(result).toEqual(createdRecord);
    });

    it('throws ConflictException if cinema name already exists', async () => {
      prisma.cinema.findFirst.mockResolvedValue({ id: 'existing-id', name: 'Cinema A' });

      await expect(
        service.create({ name: 'Cinema A', bundleSizes: [2, 5] }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('returns all cinemas ordered by name', async () => {
      const mockList = [{ id: '1', name: 'Cinema A', bundleSizes: [2, 5] }];
      prisma.cinema.findMany.mockResolvedValue(mockList);

      const result = await service.findAll();
      expect(prisma.cinema.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
      });
      expect(result).toEqual(mockList);
    });
  });

  describe('findOne', () => {
    it('returns cinema if found', async () => {
      const mockCinema = { id: 'uuid-1', name: 'Cinema A', bundleSizes: [2, 5] };
      prisma.cinema.findUnique.mockResolvedValue(mockCinema);

      const result = await service.findOne('uuid-1');
      expect(result).toEqual(mockCinema);
    });

    it('throws NotFoundException if cinema does not exist', async () => {
      prisma.cinema.findUnique.mockResolvedValue(null);

      await expect(service.findOne('uuid-nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getBookingQuote', () => {
    it('returns optimal booking quote for valid groupSize (e.g. Cinema A [2, 5], group 11)', async () => {
      prisma.cinema.findUnique.mockResolvedValue({
        id: 'c-1',
        name: 'Cinema A',
        bundleSizes: [2, 5],
      });

      const quote = await service.getBookingQuote('c-1', 11);

      expect(quote).toEqual({
        cinema: {
          id: 'c-1',
          name: 'Cinema A',
          bundleSizes: [2, 5],
        },
        groupSize: 11,
        possible: true,
        totalBundles: 4,
        bundles: [
          { size: 5, quantity: 1 },
          { size: 2, quantity: 3 },
        ],
        totalSeats: 11,
      });
    });

    it('returns possible: false when no exact bundle combination exists (e.g. [4, 6], group 7)', async () => {
      prisma.cinema.findUnique.mockResolvedValue({
        id: 'c-2',
        name: 'Cinema B',
        bundleSizes: [4, 6],
      });

      const quote = await service.getBookingQuote('c-2', 7);

      expect(quote).toEqual({
        cinema: {
          id: 'c-2',
          name: 'Cinema B',
          bundleSizes: [4, 6],
        },
        groupSize: 7,
        possible: false,
        totalBundles: null,
        bundles: [],
        totalSeats: null,
      });
    });

    it('throws NotFoundException if cinema ID is unknown', async () => {
      prisma.cinema.findUnique.mockResolvedValue(null);

      await expect(service.getBookingQuote('c-unknown', 10)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
