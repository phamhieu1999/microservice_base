import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { DLQService } from './dlq.service';
import { FailedMessage, FailedMessageDocument } from './schemas/failed-message.schema';
import { Model } from 'mongoose';

describe('DLQService', () => {
  let service: DLQService;
  let model: Model<FailedMessageDocument>;

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

  const mockModel = {
    find: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    updateOne: jest.fn(),
    deleteOne: jest.fn(),
    collection: {
      createIndex: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DLQService,
        {
          provide: getModelToken(FailedMessage.name),
          useValue: mockModel,
        },
      ],
    }).compile();

    service = module.get<DLQService>(DLQService);
    model = module.get<Model<FailedMessageDocument>>(getModelToken(FailedMessage.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('listFailedMessages', () => {
    it('should return list of failed messages', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockFailedMessage]),
      };

      mockModel.find.mockReturnValue(mockQuery);

      const result = await service.listFailedMessages(50, 0);

      expect(mockModel.find).toHaveBeenCalled();
      expect(mockQuery.sort).toHaveBeenCalledWith({ timestamp: -1 });
      expect(mockQuery.limit).toHaveBeenCalledWith(50);
      expect(mockQuery.skip).toHaveBeenCalledWith(0);
      expect(result).toEqual([mockFailedMessage]);
    });
  });

  describe('getFailedMessage', () => {
    it('should return a failed message by id', async () => {
      mockModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockFailedMessage),
      });

      const result = await service.getFailedMessage('507f1f77bcf86cd799439011');

      expect(mockModel.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(result).toEqual(mockFailedMessage);
    });

    it('should return null if message not found', async () => {
      mockModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.getFailedMessage('507f1f77bcf86cd799439011');

      expect(result).toBeNull();
    });
  });

  describe('retryFailedMessage', () => {
    it('should throw error if message not found', async () => {
      mockModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.retryFailedMessage('507f1f77bcf86cd799439011')).rejects.toThrow(
        'Failed message not found',
      );
    });

    it('should throw error if message is already retrying', async () => {
      const retryingMessage = { ...mockFailedMessage, status: 'RETRYING' };
      mockModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(retryingMessage),
      });

      await expect(service.retryFailedMessage('507f1f77bcf86cd799439011')).rejects.toThrow(
        'Message is already being retried',
      );
    });

    it('should schedule retry for pending message', async () => {
      jest.useFakeTimers();
      mockModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockFailedMessage),
      });
      mockModel.updateOne.mockResolvedValue({});

      const result = await service.retryFailedMessage('507f1f77bcf86cd799439011');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Retry scheduled');
      expect(result.delayMs).toBe(1000);

      jest.useRealTimers();
    });
  });

  describe('deleteFailedMessage', () => {
    it('should delete a failed message', async () => {
      mockModel.deleteOne.mockResolvedValue({ deletedCount: 1 });

      const result = await service.deleteFailedMessage('507f1f77bcf86cd799439011');

      expect(mockModel.deleteOne).toHaveBeenCalledWith({ _id: '507f1f77bcf86cd799439011' });
      expect(result).toEqual({ success: true });
    });
  });
});

