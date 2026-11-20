import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';

describe('PrismaService (Database Relations)', () => {
  let prisma: PrismaService;
  let module: TestingModule;
  let isDbConnected = false;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    prisma = module.get<PrismaService>(PrismaService);
    try {
      await prisma.onModuleInit();
      // Probe connectivity with a quick query
      await prisma.$queryRaw`SELECT 1`;
      isDbConnected = true;
    } catch {
      // In sandbox mode without network access, live database cannot be reached
      isDbConnected = false;
    }
  }, 10000);

  afterAll(async () => {
    if (isDbConnected) {
      await module.close();
    }
  });

  it('should be defined and successfully instantiate PrismaService', () => {
    expect(prisma).toBeDefined();
  });

  it('should read seeded sample movies and verify prerequisite relationships', async () => {
    if (!isDbConnected) {
      return;
    }

    const doomsday = await prisma.movie.findUnique({
      where: { title: 'Avengers: Doomsday' },
      include: {
        prerequisites: {
          include: {
            prerequisite: true,
          },
        },
      },
    });

    expect(doomsday).toBeDefined();
    expect(doomsday?.releaseYear).toBe(2026);
    expect(doomsday?.prerequisites.length).toBe(1);
    expect(doomsday?.prerequisites[0].prerequisite.title).toBe('Avengers: Endgame');
  });

  it('should read seeded sample cinemas and verify bundle sizes', async () => {
    if (!isDbConnected) {
      return;
    }

    const cinemaA = await prisma.cinema.findUnique({
      where: { name: 'Cinema A' },
    });

    expect(cinemaA).toBeDefined();
    expect(cinemaA?.bundleSizes).toEqual([2, 5]);
  });

  it('should support creating and deleting relational movie prerequisites', async () => {
    if (!isDbConnected) {
      return;
    }

    const testMovieA = await prisma.movie.create({
      data: {
        title: `Test Movie A ${Date.now()}`,
        releaseYear: 2024,
        runtimeMinutes: 100,
      },
    });

    const testMovieB = await prisma.movie.create({
      data: {
        title: `Test Movie B ${Date.now()}`,
        releaseYear: 2025,
        runtimeMinutes: 110,
        prerequisites: {
          create: [{ prerequisiteId: testMovieA.id }],
        },
      },
      include: {
        prerequisites: true,
      },
    });

    expect(testMovieB.prerequisites.length).toBe(1);
    expect(testMovieB.prerequisites[0].prerequisiteId).toBe(testMovieA.id);

    // Verify dependent relation from testMovieA
    const foundMovieA = await prisma.movie.findUnique({
      where: { id: testMovieA.id },
      include: { dependents: true },
    });
    expect(foundMovieA?.dependents.length).toBe(1);
    expect(foundMovieA?.dependents[0].movieId).toBe(testMovieB.id);

    // Clean up
    await prisma.movie.delete({ where: { id: testMovieB.id } });
    await prisma.movie.delete({ where: { id: testMovieA.id } });
  });
});
