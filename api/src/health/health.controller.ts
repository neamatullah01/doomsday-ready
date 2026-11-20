import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthResponseDto } from './dto/health-response.dto';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({
    summary: 'Health check',
    description: 'Verifies service availability and returns timestamp.',
  })
  @ApiOkResponse({
    type: HealthResponseDto,
    description: 'Service is healthy',
  })
  check(): HealthResponseDto {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
