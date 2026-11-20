import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
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
import { CinemasService } from './cinemas.service';
import { CreateCinemaDto } from './dto/create-cinema.dto';
import { CinemaResponseDto } from './dto/cinema-response.dto';
import { BookingQueryDto } from './dto/booking-query.dto';
import { BookingResponseDto } from './dto/booking-response.dto';
import { ErrorResponseDto } from '../common/dto/error-response.dto';

@ApiTags('Cinemas')
@Controller('cinemas')
export class CinemasController {
  constructor(private readonly cinemasService: CinemasService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create cinema',
    description:
      'Creates a new cinema with 1 to 10 distinct seat bundle sizes (values 1–500). Enforces unique cinema names.',
  })
  @ApiCreatedResponse({
    type: CinemaResponseDto,
    description: 'Cinema created successfully',
  })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'Validation failed or bundle size constraints violated',
  })
  @ApiConflictResponse({
    type: ErrorResponseDto,
    description: 'Cinema name already exists',
  })
  create(@Body() dto: CreateCinemaDto) {
    return this.cinemasService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List cinemas',
    description: 'Returns all cinemas and their seat-bundle sizes sorted by name.',
  })
  @ApiOkResponse({
    type: [CinemaResponseDto],
    description: 'List of all cinemas',
  })
  findAll() {
    return this.cinemasService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get cinema by ID',
    description: 'Retrieves a single cinema and its bundle sizes by UUID.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Cinema UUID',
    example: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6',
  })
  @ApiOkResponse({
    type: CinemaResponseDto,
    description: 'Cinema details retrieved successfully',
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: 'Cinema not found',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.cinemasService.findOne(id);
  }

  @Get(':id/booking')
  @ApiOperation({
    summary: 'Get booking quote',
    description:
      'Calculates the optimal minimum bundle combination for a given watch-party group size using unbounded dynamic programming. Returns fewest total bundles or possible: false.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Cinema UUID',
    example: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6',
  })
  @ApiOkResponse({
    type: BookingResponseDto,
    description: 'Booking quote calculation result',
  })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'Invalid group size (must be integer 1–10,000)',
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: 'Cinema not found',
  })
  getBookingQuote(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: BookingQueryDto,
  ) {
    return this.cinemasService.getBookingQuote(id, query.groupSize);
  }
}
