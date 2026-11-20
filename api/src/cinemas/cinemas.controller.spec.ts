import { Test, TestingModule } from '@nestjs/testing';
import { CinemasController } from './cinemas.controller';
import { CinemasService } from './cinemas.service';

describe('CinemasController', () => {
  let controller: CinemasController;
  let service: Partial<Record<keyof CinemasService, jest.Mock>>;

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      getBookingQuote: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CinemasController],
      providers: [
        {
          provide: CinemasService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<CinemasController>(CinemasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call cinemasService.create', async () => {
    const dto = { name: 'Cinema A', bundleSizes: [2, 5] };
    service.create?.mockResolvedValue({ id: 'uuid-c1', ...dto });

    const result = await controller.create(dto);
    expect(service.create).toHaveBeenCalledWith(dto);
    expect(result).toHaveProperty('id', 'uuid-c1');
  });

  it('should call cinemasService.findAll', async () => {
    service.findAll?.mockResolvedValue([]);
    const result = await controller.findAll();
    expect(service.findAll).toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it('should call cinemasService.findOne', async () => {
    service.findOne?.mockResolvedValue({ id: 'uuid-c1', name: 'Cinema A' });
    const result = await controller.findOne('uuid-c1');
    expect(service.findOne).toHaveBeenCalledWith('uuid-c1');
    expect(result).toHaveProperty('id', 'uuid-c1');
  });

  it('should call cinemasService.getBookingQuote', async () => {
    const mockQuote = {
      cinema: { id: 'uuid-c1', name: 'Cinema A', bundleSizes: [2, 5] },
      groupSize: 11,
      possible: true,
      totalBundles: 4,
      bundles: [
        { size: 5, quantity: 1 },
        { size: 2, quantity: 3 },
      ],
      totalSeats: 11,
    };
    service.getBookingQuote?.mockResolvedValue(mockQuote);

    const result = await controller.getBookingQuote('uuid-c1', { groupSize: 11 });
    expect(service.getBookingQuote).toHaveBeenCalledWith('uuid-c1', 11);
    expect(result).toEqual(mockQuote);
  });
});
