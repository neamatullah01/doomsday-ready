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
});
