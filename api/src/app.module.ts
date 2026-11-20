import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { MoviesModule } from './movies/movies.module';
import { CinemasModule } from './cinemas/cinemas.module';

@Module({
  imports: [PrismaModule, HealthModule, MoviesModule, CinemasModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
