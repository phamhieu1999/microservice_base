import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { DLQController } from './dlq.controller';
import { DLQService } from './dlq.service';

describe('DLQController', () => {
  let controller: DLQController;
  let service: DLQService;

  const mockFailedMessage = {
    _id: '507f1f77bcf86cd799439011',
    originalTopic: 'test-topic',
    originalPartition: 0,
    originalOffset: '123',
    originalKey: 'test-key',
    originalValue: { data: 'test' },
    error: 'Test error',
    timestamp: new Date(),
    retryCount: 0,
    status: 'PENDING',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDLQService = {
    listFailedMessages: jest.fn(),
    getFailedMessage: jest.fn(),
    retryFailedMessage: jest.fn(),
    deleteFailedMessage: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DLQController],
      providers: [
        {
          provide: DLQService,
          useValue: mockDLQService,
        },
      ],
    }).compile();

    controller = module.get<DLQController>(DLQController);
    service = module.get<DLQService>(DLQService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('listFailedMessages', () => {
    it('should return list of failed messages', async () => {
      mockDLQService.listFailedMessages.mockResolvedValue([mockFailedMessage]);

      const result = await controller.listFailedMessages({ limit: 50, skip: 0 });

      expect(service.listFailedMessages).toHaveBeenCalledWith(50, 0);
      expect(result).toEqual([mockFailedMessage]);
    });

    it('should use default values when query params are not provided', async () => {
      mockDLQService.listFailedMessages.mockResolvedValue([mockFailedMessage]);

      const result = await controller.listFailedMessages({});

      expect(service.listFailedMessages).toHaveBeenCalledWith(50, 0);
      expect(result).toEqual([mockFailedMessage]);
    });
  });

  describe('getFailedMessage', () => {
    it('should return a failed message by id', async () => {
      mockDLQService.getFailedMessage.mockResolvedValue(mockFailedMessage);

      const result = await controller.getFailedMessage('507f1f77bcf86cd799439011');

      expect(service.getFailedMessage).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(result).toEqual(mockFailedMessage);
    });

    it('should throw HttpException if message not found', async () => {
      mockDLQService.getFailedMessage.mockResolvedValue(null);

      await expect(controller.getFailedMessage('507f1f77bcf86cd799439011')).rejects.toThrow(
        HttpException,
      );
      await expect(controller.getFailedMessage('507f1f77bcf86cd799439011')).rejects.toThrow(
        'Failed message not found',
      );
    });
  });

  describe('retryFailedMessage', () => {
    it('should retry a failed message', async () => {
      const retryResponse = { success: true, message: 'Retry scheduled', delayMs: 1000 };
      mockDLQService.retryFailedMessage.mockResolvedValue(retryResponse);

      const result = await controller.retryFailedMessage('507f1f77bcf86cd799439011');

      expect(service.retryFailedMessage).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(result).toEqual(retryResponse);
    });

    it('should throw HttpException if message not found', async () => {
      mockDLQService.retryFailedMessage.mockRejectedValue(
        new Error('Failed message not found'),
      );

      await expect(controller.retryFailedMessage('507f1f77bcf86cd799439011')).rejects.toThrow(
        HttpException,
      );
    });

    it('should throw HttpException if message is already retrying', async () => {
      mockDLQService.retryFailedMessage.mockRejectedValue(
        new Error('Message is already being retried'),
      );

      await expect(controller.retryFailedMessage('507f1f77bcf86cd799439011')).rejects.toThrow(
        HttpException,
      );
    });
  });

  describe('deleteFailedMessage', () => {
    it('should delete a failed message', async () => {
      mockDLQService.deleteFailedMessage.mockResolvedValue({ success: true });

      const result = await controller.deleteFailedMessage('507f1f77bcf86cd799439011');

      expect(service.deleteFailedMessage).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(result).toEqual({ success: true });
    });
  });
});

