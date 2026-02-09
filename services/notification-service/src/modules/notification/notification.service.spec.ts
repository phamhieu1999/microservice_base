import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotificationService } from './notification.service';
import { Notification, NotificationDocument } from './schemas/notification.schema';

describe('NotificationService', () => {
  let service: NotificationService;
  let model: Model<NotificationDocument>;

  const mockNotificationModel = {
    create: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
    updateOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: getModelToken(Notification.name),
          useValue: mockNotificationModel,
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    model = module.get<Model<NotificationDocument>>(getModelToken(Notification.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a notification', async () => {
      const mockNotification = {
        _id: '123',
        userId: 'user1',
        type: 'ORDER_CREATED',
        title: 'Order Created',
        content: 'Your order has been created',
        metadata: { orderId: 'order123' },
        read: false,
      };

      mockNotificationModel.create.mockResolvedValue(mockNotification);

      const result = await service.create(
        'user1',
        'ORDER_CREATED',
        'Order Created',
        'Your order has been created',
        { orderId: 'order123' },
      );

      expect(result).toEqual(mockNotification);
      expect(mockNotificationModel.create).toHaveBeenCalledWith({
        userId: 'user1',
        type: 'ORDER_CREATED',
        title: 'Order Created',
        content: 'Your order has been created',
        metadata: { orderId: 'order123' },
      });
    });
  });

  describe('listByUser', () => {
    it('should return paginated notifications for a user', async () => {
      const mockNotifications = [
        { _id: '1', userId: 'user1', type: 'ORDER_CREATED', title: 'Order 1', content: 'Content 1', read: false },
        { _id: '2', userId: 'user1', type: 'PAYMENT_SUCCESS', title: 'Payment 1', content: 'Content 2', read: true },
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockNotifications),
      };

      mockNotificationModel.find.mockReturnValue(mockQuery);
      mockNotificationModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(2),
      });

      const result = await service.listByUser('user1', 1, 20);

      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('total', 2);
      expect(result).toHaveProperty('page', 1);
      expect(result).toHaveProperty('limit', 20);
      expect(result.items).toHaveLength(2);
      expect(mockNotificationModel.find).toHaveBeenCalledWith({ userId: 'user1' });
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      mockNotificationModel.updateOne.mockResolvedValue({ modifiedCount: 1 });

      const result = await service.markAsRead('notification123', 'user1');

      expect(mockNotificationModel.updateOne).toHaveBeenCalledWith(
        { _id: 'notification123', userId: 'user1' },
        { read: true },
      );
      expect(result.modifiedCount).toBe(1);
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count for a user', async () => {
      mockNotificationModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(5),
      });

      const result = await service.getUnreadCount('user1');

      expect(result).toBe(5);
      expect(mockNotificationModel.countDocuments).toHaveBeenCalledWith({ userId: 'user1', read: false });
    });
  });
});











