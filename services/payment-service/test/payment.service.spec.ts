import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from '../src/modules/payment/payment.service';
import { PaymentRepository } from '../src/modules/payment/payment.repository';
import { KafkaService } from '../src/kafka/kafka.service';
import { PromotionClient } from '../src/promotion/promotion.client';
import { PaymentProviderFactory } from '../src/modules/payment/providers/payment-provider.factory';
import { MockProvider } from '../src/modules/payment/providers/mock.provider';

describe('PaymentService', () => {
  let service: PaymentService;
  let repo: jest.Mocked<PaymentRepository>;
  let kafka: jest.Mocked<KafkaService>;
  let promotionClient: jest.Mocked<PromotionClient>;
  let providerFactory: jest.Mocked<PaymentProviderFactory>;
  let mockProvider: jest.Mocked<MockProvider>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: PaymentRepository,
          useValue: {
            createPending: jest.fn(),
            findById: jest.fn(),
            findByIdempotencyKey: jest.fn(),
            findByOrderId: jest.fn(),
            markSuccess: jest.fn(),
            markFailed: jest.fn(),
            updateStatus: jest.fn(),
            refund: jest.fn(),
          },
        },
        {
          provide: KafkaService,
          useValue: {
            emit: jest.fn(),
          },
        },
        {
          provide: PromotionClient,
          useValue: {
            apply: jest.fn(),
          },
        },
        {
          provide: PaymentProviderFactory,
          useValue: {
            getProvider: jest.fn(),
          },
        },
        {
          provide: MockProvider,
          useValue: {
            createPayment: jest.fn(),
            verifyWebhook: jest.fn(),
            processWebhook: jest.fn(),
            refund: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    repo = module.get(PaymentRepository);
    kafka = module.get(KafkaService);
    promotionClient = module.get(PromotionClient);
    providerFactory = module.get(PaymentProviderFactory);
    mockProvider = module.get(MockProvider);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPayment', () => {
    it('should create payment with idempotency key', async () => {
      const dto = {
        orderId: 'order-123',
        amount: 100000,
        provider: 'MOCK' as any,
        idempotencyKey: 'key-123',
      };

      repo.findByIdempotencyKey.mockResolvedValue(null);
      repo.createPending.mockResolvedValue({
        id: 'payment-123',
        orderId: 'order-123',
        amount: 100000,
        status: 'PENDING',
      } as any);

      providerFactory.getProvider.mockReturnValue(mockProvider);
      mockProvider.createPayment.mockResolvedValue({
        success: true,
        paymentId: 'order-123',
        providerTxnId: 'txn-123',
        paymentUrl: 'http://mock-payment.com',
      });

      repo.updateStatus.mockResolvedValue(undefined);

      const result = await service.createPayment(dto, 'user-123');

      expect(repo.findByIdempotencyKey).toHaveBeenCalledWith('key-123');
      expect(repo.createPending).toHaveBeenCalled();
      expect(mockProvider.createPayment).toHaveBeenCalled();
      expect(result.payment).toBeDefined();
      expect(result.paymentUrl).toBe('http://mock-payment.com');
    });

    it('should return existing payment if idempotency key exists', async () => {
      const dto = {
        orderId: 'order-123',
        amount: 100000,
        idempotencyKey: 'key-123',
      };

      const existingPayment = {
        id: 'payment-123',
        orderId: 'order-123',
        amount: 100000,
        status: 'PENDING',
      };

      repo.findByIdempotencyKey.mockResolvedValue(existingPayment as any);

      const result = await service.createPayment(dto, 'user-123');

      expect(repo.findByIdempotencyKey).toHaveBeenCalledWith('key-123');
      expect(repo.createPending).not.toHaveBeenCalled();
      expect(result.payment).toEqual(existingPayment);
    });

    it('should return existing payment if idempotency key exists', async () => {
      const dto = {
        orderId: 'order-123',
        amount: 100000,
        idempotencyKey: 'key-123',
      };

      const existingPayment = {
        id: 'payment-123',
        orderId: 'order-123',
        amount: 100000,
        status: 'PENDING',
      };

      repo.findByIdempotencyKey.mockResolvedValue(existingPayment as any);

      const result = await service.createPayment(dto, 'user-123');

      expect(repo.findByIdempotencyKey).toHaveBeenCalledWith('key-123');
      expect(repo.createPending).not.toHaveBeenCalled();
      expect(result.payment).toEqual(existingPayment);
    });
  });

  describe('handleWebhook', () => {
    it('should process webhook and update payment status', async () => {
      const payload = {
        providerTxnId: 'txn-123',
        status: 'SUCCESS',
        metadata: { orderId: 'order-123', userId: 'user-123' },
      };

      providerFactory.getProvider.mockReturnValue(mockProvider);
      mockProvider.verifyWebhook.mockReturnValue(true);
      mockProvider.processWebhook.mockResolvedValue({
        paymentId: 'order-123',
        status: 'SUCCESS',
      });

      repo.findByOrderId.mockResolvedValue([
        {
          id: 'payment-123',
          orderId: 'order-123',
          amount: 100000,
          status: 'PENDING',
        } as any,
      ]);

      repo.updateStatus.mockResolvedValue(undefined);
      kafka.emit.mockResolvedValue(undefined);

      const result = await service.handleWebhook('MOCK', payload, 'signature');

      expect(mockProvider.verifyWebhook).toHaveBeenCalled();
      expect(mockProvider.processWebhook).toHaveBeenCalled();
      expect(repo.updateStatus).toHaveBeenCalledWith('payment-123', 'SUCCESS', expect.any(String));
      expect(kafka.emit).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });
  });

  describe('refund', () => {
    it('should refund payment successfully', async () => {
      const payment = {
        id: 'payment-123',
        orderId: 'order-123',
        amount: 100000,
        status: 'SUCCESS',
        refundedAmount: 0,
      };

      repo.findById.mockResolvedValue(payment as any);
      providerFactory.getProvider.mockReturnValue(mockProvider);
      mockProvider.refund.mockResolvedValue({
        success: true,
        refundId: 'refund-123',
      });

      repo.refund.mockResolvedValue(undefined);

      const result = await service.refund('payment-123', { amount: 50000 });

      expect(repo.findById).toHaveBeenCalledWith('payment-123');
      expect(mockProvider.refund).toHaveBeenCalled();
      expect(repo.refund).toHaveBeenCalledWith('payment-123', 50000);
      expect(result.success).toBe(true);
    });

    it('should throw error if payment not found', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.refund('payment-123', { amount: 50000 })).rejects.toThrow();
    });

    it('should throw error if payment not successful', async () => {
      const payment = {
        id: 'payment-123',
        status: 'PENDING',
      };

      repo.findById.mockResolvedValue(payment as any);

      await expect(service.refund('payment-123', { amount: 50000 })).rejects.toThrow();
    });
  });
});

