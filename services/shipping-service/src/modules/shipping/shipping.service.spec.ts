import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShippingService } from './shipping.service';
import { ShippingQuoteDto } from './dto/shipping-quote.dto';
import { ShippingMethod } from '../../database/entities/shipping-method.entity';
import { ShippingQuote } from '../../database/entities/shipping-quote.entity';
import { ShippingOrder } from '../../database/entities/shipping-order.entity';
import { KafkaService } from '../../kafka/kafka.service';

describe('ShippingService', () => {
  let service: ShippingService;
  let shippingMethodRepo: Repository<ShippingMethod>;
  let shippingQuoteRepo: Repository<ShippingQuote>;
  let kafkaService: KafkaService;

  const mockShippingMethod: ShippingMethod = {
    id: 'method-1',
    name: 'Standard Shipping',
    type: 'STANDARD',
    baseFee: 15000,
    perItemFee: 2000,
    perKgFee: 5000,
    estimatedDays: 3,
    status: 'ACTIVE',
    description: 'Standard delivery',
    quotes: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShippingService,
        {
          provide: getRepositoryToken(ShippingMethod),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ShippingQuote),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ShippingOrder),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
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

    service = module.get<ShippingService>(ShippingService);
    shippingMethodRepo = module.get<Repository<ShippingMethod>>(getRepositoryToken(ShippingMethod));
    shippingQuoteRepo = module.get<Repository<ShippingQuote>>(getRepositoryToken(ShippingQuote));
    kafkaService = module.get<KafkaService>(KafkaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('quote', () => {
    it('should calculate shipping quotes for active methods', async () => {
      const dto: ShippingQuoteDto = {
        address: '123 Test Street',
        items: [
          {
            productId: 'product-1',
            sellerId: 'seller-1',
            price: 100000,
            quantity: 1,
            weight: 0.5,
          },
        ],
      };

      jest.spyOn(shippingMethodRepo, 'find').mockResolvedValue([mockShippingMethod]);
      jest.spyOn(shippingQuoteRepo, 'create').mockReturnValue({
        id: 'quote-1',
        shippingMethodId: 'method-1',
        status: 'PENDING',
        totalFee: 17000,
        estimatedDays: 3,
        expiresAt: new Date(),
        createdAt: new Date(),
      } as ShippingQuote);
      jest.spyOn(shippingQuoteRepo, 'save').mockResolvedValue({
        id: 'quote-1',
        shippingMethodId: 'method-1',
        status: 'PENDING',
        totalFee: 17000,
        estimatedDays: 3,
        expiresAt: new Date(),
        createdAt: new Date(),
      } as ShippingQuote);

      const result = await service.quote(dto);

      expect(result).toBeDefined();
      expect(result.quotes).toBeDefined();
      expect(result.quotes.length).toBeGreaterThan(0);
      expect(result.totalQuotes).toBe(1);
      expect(result.quotes[0].totalFee).toBeGreaterThan(0);
    });

    it('should throw error when no active methods found', async () => {
      const dto: ShippingQuoteDto = {
        address: '123 Test Street',
        items: [
          {
            productId: 'product-1',
            price: 100000,
            quantity: 1,
            weight: 0.5,
          },
        ],
      };

      jest.spyOn(shippingMethodRepo, 'find').mockResolvedValue([]);

      await expect(service.quote(dto)).rejects.toThrow('No active shipping methods found');
    });
  });
});

