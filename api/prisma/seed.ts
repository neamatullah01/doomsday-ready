import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const sampleMovies = [
  { title: 'Iron Man', releaseYear: 2008, runtimeMinutes: 126, prereqs: [] as string[] },
  { title: 'Captain America: The First Avenger', releaseYear: 2011, runtimeMinutes: 124, prereqs: [] as string[] },
  {
    title: 'The Avengers',
    releaseYear: 2012,
    runtimeMinutes: 143,
    prereqs: ['Iron Man', 'Captain America: The First Avenger'],
  },
  {
    title: 'Captain America: Civil War',
    releaseYear: 2016,
    runtimeMinutes: 147,
    prereqs: ['The Avengers'],
  },
  { title: 'Thor: Ragnarok', releaseYear: 2017, runtimeMinutes: 130, prereqs: [] as string[] },
  {
    title: 'Avengers: Infinity War',
    releaseYear: 2018,
    runtimeMinutes: 149,
    prereqs: ['Captain America: Civil War', 'Thor: Ragnarok'],
  },
  {
    title: 'Avengers: Endgame',
    releaseYear: 2019,
    runtimeMinutes: 181,
    prereqs: ['Avengers: Infinity War'],
  },
  {
    title: 'Avengers: Doomsday',
    releaseYear: 2026,
    runtimeMinutes: 180,
    prereqs: ['Avengers: Endgame'],
  },
];

const sampleCinemas = [
  { name: 'Cinema A', bundleSizes: [2, 5] },
  { name: 'Cinema B', bundleSizes: [4, 6] },
  { name: 'Cinema C', bundleSizes: [1, 3, 4] },
  { name: 'Cinema D', bundleSizes: [6, 9, 20] },
];

async function main() {
  console.log('Seeding sample data...');

  // Upsert sample movies
  const createdMovies = new Map<string, string>();
  for (const movie of sampleMovies) {
    const record = await prisma.movie.upsert({
      where: { title: movie.title },
      update: {
        releaseYear: movie.releaseYear,
        runtimeMinutes: movie.runtimeMinutes,
      },
      create: {
        title: movie.title,
        releaseYear: movie.releaseYear,
        runtimeMinutes: movie.runtimeMinutes,
        watched: false,
      },
    });
    createdMovies.set(movie.title, record.id);
  }

  // Create prerequisite relationships
  for (const movie of sampleMovies) {
    const movieId = createdMovies.get(movie.title)!;
    for (const prereqTitle of movie.prereqs) {
      const prereqId = createdMovies.get(prereqTitle)!;
      await prisma.moviePrerequisite.upsert({
        where: {
          movieId_prerequisiteId: {
            movieId,
            prerequisiteId: prereqId,
          },
        },
        update: {},
        create: {
          movieId,
          prerequisiteId: prereqId,
        },
      });
    }
  }

  // Upsert sample cinemas
  for (const cinema of sampleCinemas) {
    await prisma.cinema.upsert({
      where: { name: cinema.name },
      update: {
        bundleSizes: [...cinema.bundleSizes].sort((a, b) => a - b),
      },
      create: {
        name: cinema.name,
        bundleSizes: [...cinema.bundleSizes].sort((a, b) => a - b),
      },
    });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
