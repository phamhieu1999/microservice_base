import { Test, TestingModule } from '@nestjs/testing';
import { CreateOrderUseCase } from '../src/application/order/use-cases/create-order.usecase';
import { CancelOrderUseCase } from '../src/application/order/use-cases/cancel-order.usecase';
import { UpdateOrderStatusUseCase } from '../src/application/order/use-cases/update-order-status.usecase';
import { IOrderRepository } from '../src/domain/order/order.repository';
import { KafkaService } from '../src/kafka/kafka.service';
import { Order, OrderStatus } from '../src/domain/order/order.entity';

describe('Order Use Cases', () => {
  let createOrderUseCase: CreateOrderUseCase;
  let cancelOrderUseCase: CancelOrderUseCase;
  let updateStatusUseCase: UpdateOrderStatusUseCase;
  let repo: jest.Mocked<IOrderRepository>;
  let kafka: jest.Mocked<KafkaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateOrderUseCase,
        CancelOrderUseCase,
        UpdateOrderStatusUseCase,
        {
          provide: 'IOrderRepository',
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            updateStatus: jest.fn(),
            updateCancellationInfo: jest.fn(),
            updateTrackingNumber: jest.fn(),
            updateShippedAt: jest.fn(),
            updateDeliveredAt: jest.fn(),
          },
        },
        {
          provide: KafkaService,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    createOrderUseCase = module.get<CreateOrderUseCase>(CreateOrderUseCase);
    cancelOrderUseCase = module.get<CancelOrderUseCase>(CancelOrderUseCase);
    updateStatusUseCase = module.get<UpdateOrderStatusUseCase>(UpdateOrderStatusUseCase);
    repo = module.get('IOrderRepository');
    kafka = module.get(KafkaService);
  });

  describe('CreateOrderUseCase', () => {
    it('should create order successfully', async () => {
      const input = {
        userId: 'user-123',
        items: [
          { productId: 'p1', quantity: 2, unitPrice: 100000, sellerId: 'seller-1' },
        ],
      };

      const savedOrder = new Order(
        'order-123',
        'user-123',
        'PENDING',
        200000,
        input.items,
      );

      repo.create.mockResolvedValue(savedOrder);
      kafka.emit.mockResolvedValue(undefined);

      const result = await createOrderUseCase.execute(input);

      expect(repo.create).toHaveBeenCalled();
      expect(kafka.emit).toHaveBeenCalledWith('order.created', expect.any(Object));
      expect(result.id).toBe('order-123');
      expect(result.totalAmount).toBe(200000);
    });
  });

  describe('CancelOrderUseCase', () => {
    it('should cancel order successfully', async () => {
      const order = new Order('order-123', 'user-123', 'PENDING', 200000, []);

      repo.findById.mockResolvedValue(order);
      repo.updateStatus.mockResolvedValue(undefined);
      repo.updateCancellationInfo.mockResolvedValue(undefined);
      kafka.emit.mockResolvedValue(undefined);

      await cancelOrderUseCase.execute({
        orderId: 'order-123',
        userId: 'user-123',
        reason: 'User cancelled',
      });

      expect(repo.findById).toHaveBeenCalledWith('order-123');
      expect(repo.updateStatus).toHaveBeenCalledWith('order-123', 'CANCELLED');
      expect(repo.updateCancellationInfo).toHaveBeenCalledWith(
        'order-123',
        'User cancelled',
        'user-123',
      );
      expect(kafka.emit).toHaveBeenCalledWith('order.cancelled', expect.any(Object));
    });

    it('should throw error if order not found', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(
        cancelOrderUseCase.execute({
          orderId: 'order-123',
          userId: 'user-123',
        }),
      ).rejects.toThrow('Order not found');
    });

    it('should throw error if order cannot be cancelled', async () => {
      const order = new Order('order-123', 'user-123', 'SHIPPED', 200000, []);

      repo.findById.mockResolvedValue(order);

      await expect(
        cancelOrderUseCase.execute({
          orderId: 'order-123',
          userId: 'user-123',
        }),
      ).rejects.toThrow('Cannot cancel order');
    });
  });

  describe('UpdateOrderStatusUseCase', () => {
    it('should update order status successfully', async () => {
      const order = new Order('order-123', 'user-123', 'PAID', 200000, []);

      repo.findById.mockResolvedValue(order);
      repo.updateStatus.mockResolvedValue(undefined);
      repo.updateTrackingNumber.mockResolvedValue(undefined);
      repo.updateShippedAt.mockResolvedValue(undefined);

      await updateStatusUseCase.execute({
        orderId: 'order-123',
        status: 'SHIPPED',
        changedBy: 'admin',
        trackingNumber: 'TRACK123',
      });

      expect(repo.findById).toHaveBeenCalledWith('order-123');
      expect(repo.updateStatus).toHaveBeenCalledWith('order-123', 'SHIPPED');
      expect(repo.updateTrackingNumber).toHaveBeenCalledWith('order-123', 'TRACK123');
      expect(repo.updateShippedAt).toHaveBeenCalledWith('order-123');
    });

    it('should throw error for invalid status transition', async () => {
      const order = new Order('order-123', 'user-123', 'PENDING', 200000, []);

      repo.findById.mockResolvedValue(order);

      await expect(
        updateStatusUseCase.execute({
          orderId: 'order-123',
          status: 'DELIVERED', // Invalid: cannot go from PENDING to DELIVERED
          changedBy: 'admin',
        }),
      ).rejects.toThrow('Cannot transition');
    });
  });
});

