import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('Movies API (e2e)', () => {
  let app: INestApplication;

  // In-memory mock database store for end-to-end API testing
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
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
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
          updatedAt: new Date().toISOString(),
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

  let createdMovieId: string;

  it('POST /api/movies - should create a movie with default watched=false', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/movies')
      .send({
        title: 'Iron Man',
        releaseYear: 2008,
        runtimeMinutes: 126,
      })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toBe('Iron Man');
    expect(res.body.releaseYear).toBe(2008);
    expect(res.body.runtimeMinutes).toBe(126);
    expect(res.body.watched).toBe(false);
    expect(res.body.prerequisites).toEqual([]);
    createdMovieId = res.body.id;
  });

  it('POST /api/movies - should reject invalid runtimeMinutes (> 300)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/movies')
      .send({
        title: 'Too Long Movie',
        releaseYear: 2020,
        runtimeMinutes: 400,
      })
      .expect(400);

    expect(res.body.statusCode).toBe(400);
    expect(res.body.code).toBe('BAD_REQUEST');
  });

  it('POST /api/movies - should reject invalid releaseYear (<= 0)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/movies')
      .send({
        title: 'Invalid Year Movie',
        releaseYear: -20,
        runtimeMinutes: 120,
      })
      .expect(400);

    expect(res.body.statusCode).toBe(400);
  });

  it('POST /api/movies - should reject empty title', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/movies')
      .send({
        title: '   ',
        releaseYear: 2020,
        runtimeMinutes: 120,
      })
      .expect(400);

    expect(res.body.statusCode).toBe(400);
  });

  it('POST /api/movies - should reject duplicate title with 409 Conflict', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/movies')
      .send({
        title: 'Iron Man',
        releaseYear: 2008,
        runtimeMinutes: 126,
      })
      .expect(409);

    expect(res.body.statusCode).toBe(409);
    expect(res.body.code).toBe('CONFLICT');
  });

  it('POST /api/movies - should reject unknown prerequisite UUID', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/movies')
      .send({
        title: 'The Avengers',
        releaseYear: 2012,
        runtimeMinutes: 143,
        prerequisiteIds: ['99999999-9999-4999-a999-999999999999'],
      })
      .expect(400);

    expect(res.body.statusCode).toBe(400);
  });

  it('GET /api/movies - should list all created movies', async () => {
    const res = await request(app.getHttpServer()).get('/api/movies').expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/movies/:id - should get movie by ID', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/movies/${createdMovieId}`)
      .expect(200);

    expect(res.body.id).toBe(createdMovieId);
    expect(res.body.title).toBe('Iron Man');
  });

  it('GET /api/movies/:id - should return 404 for non-existent UUID', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/movies/88888888-8888-4888-a888-888888888888')
      .expect(404);

    expect(res.body.statusCode).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
  });

  it('PATCH /api/movies/:id - should update watched status', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/movies/${createdMovieId}`)
      .send({ watched: true })
      .expect(200);

    expect(res.body.watched).toBe(true);
  });

  it('PATCH /api/movies/:id - should reject direct self-dependency with 409 CIRCULAR_DEPENDENCY', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/movies/${createdMovieId}`)
      .send({ prerequisiteIds: [createdMovieId] })
      .expect(409);

    expect(res.body.statusCode).toBe(409);
    expect(res.body.code).toBe('CIRCULAR_DEPENDENCY');
  });

  it('GET /api/movies/:id/rewatch-order - should return valid rewatch order with runtime and progress', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/movies/${createdMovieId}/rewatch-order`)
      .expect(200);

    expect(res.body).toHaveProperty('targetMovie');
    expect(res.body.targetMovie.id).toBe(createdMovieId);
    expect(res.body).toHaveProperty('movies');
    expect(res.body).toHaveProperty('watchedCount');
    expect(res.body).toHaveProperty('totalCount');
    expect(res.body).toHaveProperty('unwatchedCount');
    expect(res.body).toHaveProperty('remainingRuntimeMinutes');
  });

  it('GET /api/movies/:id/rewatch-order - should return 404 for non-existent target movie', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/movies/88888888-8888-4888-a888-888888888888/rewatch-order')
      .expect(404);

    expect(res.body.statusCode).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
  });
});
