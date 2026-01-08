import { Test, TestingModule } from '@nestjs/testing';
import { ShippingController } from './shipping.controller';
import { ShippingService } from './shipping.service';
import { ShippingQuoteDto } from './dto/shipping-quote.dto';
import { ShippingMethodType } from './dto/create-shipping-method.dto';

describe('ShippingController', () => {
  let controller: ShippingController;
  let service: ShippingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShippingController],
      providers: [
        {
          provide: ShippingService,
          useValue: {
            quote: jest.fn(),
            getAllShippingMethods: jest.fn(),
            getShippingMethodById: jest.fn(),
            createShippingMethod: jest.fn(),
            updateShippingMethod: jest.fn(),
            deleteShippingMethod: jest.fn(),
            getQuoteById: jest.fn(),
            acceptQuote: jest.fn(),
            createShippingOrder: jest.fn(),
            getAllShippingOrders: jest.fn(),
            getShippingOrderByOrderId: jest.fn(),
            getShippingOrderByTrackingNumber: jest.fn(),
            updateTracking: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ShippingController>(ShippingController);
    service = module.get<ShippingService>(ShippingService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('quote', () => {
    it('should call service.quote with correct dto', async () => {
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

      const expectedResult = {
        quotes: [
          {
            quoteId: 'quote-1',
            methodId: 'method-1',
            methodName: 'Standard Shipping',
            methodType: ShippingMethodType.STANDARD,
            totalFee: 17000,
            estimatedDays: 3,
            expiresAt: new Date(),
          },
        ],
        totalQuotes: 1,
      };

      jest.spyOn(service, 'quote').mockResolvedValue(expectedResult);

      const result = await controller.quote(dto);

      expect(service.quote).toHaveBeenCalledWith(dto, undefined);
      expect(result).toEqual(expectedResult);
    });
  });
});

