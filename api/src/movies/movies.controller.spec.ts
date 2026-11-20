import { Test, TestingModule } from '@nestjs/testing';
import { MoviesController } from './movies.controller';
import { MoviesService } from './movies.service';

describe('MoviesController', () => {
  let controller: MoviesController;
  let service: Partial<Record<keyof MoviesService, jest.Mock>>;

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      getRewatchOrder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MoviesController],
      providers: [
        {
          provide: MoviesService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<MoviesController>(MoviesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call moviesService.create', async () => {
    const dto = { title: 'Iron Man', releaseYear: 2008, runtimeMinutes: 126 };
    service.create?.mockResolvedValue({ id: 'uuid', ...dto, watched: false, prerequisites: [] });

    const result = await controller.create(dto);
    expect(service.create).toHaveBeenCalledWith(dto);
    expect(result).toHaveProperty('id', 'uuid');
  });

  it('should call moviesService.findAll', async () => {
    service.findAll?.mockResolvedValue([]);
    const result = await controller.findAll();
    expect(service.findAll).toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it('should call moviesService.findOne', async () => {
    service.findOne?.mockResolvedValue({ id: 'uuid-1', title: 'Iron Man' });
    const result = await controller.findOne('uuid-1');
    expect(service.findOne).toHaveBeenCalledWith('uuid-1');
    expect(result).toHaveProperty('id', 'uuid-1');
  });

  it('should call moviesService.update', async () => {
    const dto = { watched: true };
    service.update?.mockResolvedValue({ id: 'uuid-1', watched: true });
    const result = await controller.update('uuid-1', dto);
    expect(service.update).toHaveBeenCalledWith('uuid-1', dto);
    expect(result).toHaveProperty('watched', true);
  });

  it('should call moviesService.getRewatchOrder', async () => {
    const rewatchResult = {
      targetMovie: { id: 'uuid-1', title: 'Iron Man' },
      movies: [],
      watchedCount: 0,
      totalCount: 0,
      unwatchedCount: 0,
      remainingRuntimeMinutes: 0,
    };
    service.getRewatchOrder?.mockResolvedValue(rewatchResult);
    const result = await controller.getRewatchOrder('uuid-1');
    expect(service.getRewatchOrder).toHaveBeenCalledWith('uuid-1');
    expect(result).toEqual(rewatchResult);
  });
});
