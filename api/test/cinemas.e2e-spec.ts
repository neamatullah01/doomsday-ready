import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('Cinemas & Booking API (e2e)', () => {
  let app: INestApplication;

  const cinemasDb = new Map<string, any>();

  const mockPrismaService: any = {
    cinema: {
      findFirst: jest.fn(async ({ where }) => {
        for (const cinema of cinemasDb.values()) {
          if (
            where.name?.equals &&
            cinema.name.toLowerCase() === where.name.equals.toLowerCase()
          ) {
            return cinema;
          }
        }
        return null;
      }),
      findMany: jest.fn(async () =>
        Array.from(cinemasDb.values()).sort((a, b) => a.name.localeCompare(b.name)),
      ),
      findUnique: jest.fn(async ({ where }) => cinemasDb.get(where.id) || null),
      create: jest.fn(async ({ data }) => {
        const id = `22222222-2222-4222-a222-${String(cinemasDb.size + 1).padStart(12, '0')}`;
        const cinema = {
          id,
          name: data.name,
          bundleSizes: data.bundleSizes,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        cinemasDb.set(id, cinema);
        return cinema;
      }),
    },
    $transaction: jest.fn(async (cb) => cb(mockPrismaService)),
    onModuleInit: jest.fn(),
    onModuleDestroy: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    cinemasDb.clear();
  });

  describe('POST /api/cinemas', () => {
    it('creates a cinema with valid name and bundleSizes', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/cinemas')
        .send({
          name: 'Cinema A',
          bundleSizes: [2, 5],
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('Cinema A');
      expect(res.body.bundleSizes).toEqual([2, 5]);
    });

    it('rejects duplicate cinema name with 409 Conflict', async () => {
      await request(app.getHttpServer())
        .post('/api/cinemas')
        .send({ name: 'Cinema A', bundleSizes: [2, 5] })
        .expect(201);

      const res = await request(app.getHttpServer())
        .post('/api/cinemas')
        .send({ name: 'Cinema A', bundleSizes: [3, 4] })
        .expect(409);

      expect(res.body.statusCode).toBe(409);
      expect(res.body.code).toBe('CONFLICT');
    });

    it('rejects empty bundle sizes array with 400', async () => {
      await request(app.getHttpServer())
        .post('/api/cinemas')
        .send({ name: 'Empty Bundles', bundleSizes: [] })
        .expect(400);
    });

    it('rejects duplicate bundle sizes in request with 400', async () => {
      await request(app.getHttpServer())
        .post('/api/cinemas')
        .send({ name: 'Duplicate Sizes', bundleSizes: [2, 2, 5] })
        .expect(400);
    });

    it('rejects bundle sizes exceeding 500 with 400', async () => {
      await request(app.getHttpServer())
        .post('/api/cinemas')
        .send({ name: 'Too Large', bundleSizes: [501] })
        .expect(400);
    });

    it('rejects bundle sizes below 1 with 400', async () => {
      await request(app.getHttpServer())
        .post('/api/cinemas')
        .send({ name: 'Zero Size', bundleSizes: [0] })
        .expect(400);
    });

    it('rejects more than 10 bundle sizes with 400', async () => {
      await request(app.getHttpServer())
        .post('/api/cinemas')
        .send({
          name: 'Too Many Sizes',
          bundleSizes: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        })
        .expect(400);
    });
  });

  describe('GET /api/cinemas', () => {
    it('returns all cinemas', async () => {
      await request(app.getHttpServer())
        .post('/api/cinemas')
        .send({ name: 'Cinema A', bundleSizes: [2, 5] })
        .expect(201);

      await request(app.getHttpServer())
        .post('/api/cinemas')
        .send({ name: 'Cinema B', bundleSizes: [4, 6] })
        .expect(201);

      const res = await request(app.getHttpServer()).get('/api/cinemas').expect(200);

      expect(res.body).toHaveLength(2);
      expect(res.body[0].name).toBe('Cinema A');
      expect(res.body[1].name).toBe('Cinema B');
    });
  });

  describe('GET /api/cinemas/:id', () => {
    it('returns cinema by ID', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/cinemas')
        .send({ name: 'Cinema C', bundleSizes: [1, 3, 4] })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get(`/api/cinemas/${created.body.id}`)
        .expect(200);

      expect(res.body.id).toBe(created.body.id);
      expect(res.body.name).toBe('Cinema C');
    });

    it('returns 404 for nonexistent cinema ID', async () => {
      await request(app.getHttpServer())
        .get('/api/cinemas/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });

  describe('GET /api/cinemas/:id/booking?groupSize=X', () => {
    it('PRD Case 1: [1, 3, 4] groupSize 6 returns 2 bundles of size 3', async () => {
      const cinemaRes = await request(app.getHttpServer())
        .post('/api/cinemas')
        .send({ name: 'Cinema [1,3,4]', bundleSizes: [1, 3, 4] })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get(`/api/cinemas/${cinemaRes.body.id}/booking?groupSize=6`)
        .expect(200);

      expect(res.body.possible).toBe(true);
      expect(res.body.totalBundles).toBe(2);
      expect(res.body.totalSeats).toBe(6);
      expect(res.body.bundles).toEqual([{ size: 3, quantity: 2 }]);
      expect(res.body.cinema.id).toBe(cinemaRes.body.id);
    });

    it('PRD Case 2: [2, 5] groupSize 11 returns four bundles: one 5, three 2', async () => {
      const cinemaRes = await request(app.getHttpServer())
        .post('/api/cinemas')
        .send({ name: 'Cinema [2,5]', bundleSizes: [2, 5] })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get(`/api/cinemas/${cinemaRes.body.id}/booking?groupSize=11`)
        .expect(200);

      expect(res.body.possible).toBe(true);
      expect(res.body.totalBundles).toBe(4);
      expect(res.body.totalSeats).toBe(11);
      expect(res.body.bundles).toEqual([
        { size: 5, quantity: 1 },
        { size: 2, quantity: 3 },
      ]);
    });

    it('PRD Case 3: [6, 9, 20] groupSize 44 returns four bundles: one 20, two 9, one 6', async () => {
      const cinemaRes = await request(app.getHttpServer())
        .post('/api/cinemas')
        .send({ name: 'Cinema [6,9,20]', bundleSizes: [6, 9, 20] })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get(`/api/cinemas/${cinemaRes.body.id}/booking?groupSize=44`)
        .expect(200);

      expect(res.body.possible).toBe(true);
      expect(res.body.totalBundles).toBe(4);
      expect(res.body.totalSeats).toBe(44);
      expect(res.body.bundles).toEqual([
        { size: 20, quantity: 1 },
        { size: 9, quantity: 2 },
        { size: 6, quantity: 1 },
      ]);
    });

    it('PRD Case 4: [4, 6] groupSize 7 returns possible: false', async () => {
      const cinemaRes = await request(app.getHttpServer())
        .post('/api/cinemas')
        .send({ name: 'Cinema [4,6]', bundleSizes: [4, 6] })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get(`/api/cinemas/${cinemaRes.body.id}/booking?groupSize=7`)
        .expect(200);

      expect(res.body.possible).toBe(false);
      expect(res.body.totalBundles).toBeNull();
      expect(res.body.bundles).toEqual([]);
      expect(res.body.totalSeats).toBeNull();
    });

    it('rejects invalid groupSize (< 1 or > 10000 or non-integer) with 400', async () => {
      const cinemaRes = await request(app.getHttpServer())
        .post('/api/cinemas')
        .send({ name: 'Cinema Validation', bundleSizes: [2, 5] })
        .expect(201);

      await request(app.getHttpServer())
        .get(`/api/cinemas/${cinemaRes.body.id}/booking?groupSize=0`)
        .expect(400);

      await request(app.getHttpServer())
        .get(`/api/cinemas/${cinemaRes.body.id}/booking?groupSize=10001`)
        .expect(400);

      await request(app.getHttpServer())
        .get(`/api/cinemas/${cinemaRes.body.id}/booking?groupSize=abc`)
        .expect(400);
    });

    it('returns 404 for unknown cinema on booking quote request', async () => {
      await request(app.getHttpServer())
        .get('/api/cinemas/00000000-0000-0000-0000-000000000000/booking?groupSize=5')
        .expect(404);
    });
  });
});
