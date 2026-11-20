import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { MoviesService } from './movies.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { MovieResponseDto } from './dto/movie-response.dto';
import { ErrorResponseDto } from '../common/dto/error-response.dto';

@ApiTags('Movies')
@Controller('movies')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create movie',
    description:
      'Creates a new MCU movie record and links any prerequisite relationships. Enforces unique title and validates runtime and release year constraints.',
  })
  @ApiCreatedResponse({
    type: MovieResponseDto,
    description: 'Movie created successfully',
  })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'Validation failed or invalid values provided',
  })
  @ApiConflictResponse({
    type: ErrorResponseDto,
    description: 'Duplicate title or circular dependency detected',
  })
  create(@Body() dto: CreateMovieDto) {
    return this.moviesService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List movies',
    description: 'Returns all movies with their prerequisite IDs sorted by release year.',
  })
  @ApiOkResponse({
    type: [MovieResponseDto],
    description: 'List of all movies',
  })
  findAll() {
    return this.moviesService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get movie by ID',
    description: 'Retrieves a single movie record and its prerequisites by UUID.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Movie UUID',
    example: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6',
  })
  @ApiOkResponse({
    type: MovieResponseDto,
    description: 'Movie details retrieved successfully',
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: 'Movie not found',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.moviesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update movie',
    description:
      'Updates movie details or watched status, or replaces the prerequisite list. Validates cycles against the proposed graph.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Movie UUID',
    example: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6',
  })
  @ApiOkResponse({
    type: MovieResponseDto,
    description: 'Movie updated successfully',
  })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'Validation failed or invalid input',
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: 'Movie not found',
  })
  @ApiConflictResponse({
    type: ErrorResponseDto,
    description: 'Duplicate title or circular dependency detected',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMovieDto,
  ) {
    return this.moviesService.update(id, dto);
  }
}
