import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ShippingQuoteDto } from './dto/shipping-quote.dto';
import { CreateShippingMethodDto } from './dto/create-shipping-method.dto';
import { CreateShippingOrderDto } from './dto/create-shipping-order.dto';
import { UpdateTrackingDto, ShippingOrderStatus } from './dto/update-tracking.dto';
import { ShippingMethod } from '../../database/entities/shipping-method.entity';
import { ShippingQuote, ShippingQuoteStatus } from '../../database/entities/shipping-quote.entity';
import { ShippingOrder } from '../../database/entities/shipping-order.entity';
import { KafkaService } from '../../kafka/kafka.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ShippingService {
  constructor(
    @InjectRepository(ShippingMethod)
    private readonly shippingMethodRepo: Repository<ShippingMethod>,
    @InjectRepository(ShippingQuote)
    private readonly shippingQuoteRepo: Repository<ShippingQuote>,
    @InjectRepository(ShippingOrder)
    private readonly shippingOrderRepo: Repository<ShippingOrder>,
    private readonly kafka: KafkaService,
  ) {}

  // ========== Shipping Methods CRUD ==========
  async getAllShippingMethods() {
    return this.shippingMethodRepo.find({
      where: { status: 'ACTIVE' },
      order: { createdAt: 'DESC' },
    });
  }

  async getShippingMethodById(id: string) {
    const method = await this.shippingMethodRepo.findOne({ where: { id } });
    if (!method) {
      throw new NotFoundException(`Shipping method with ID ${id} not found`);
    }
    return method;
  }

  async createShippingMethod(dto: CreateShippingMethodDto) {
    const method = this.shippingMethodRepo.create({
      ...dto,
      status: dto.status || 'ACTIVE',
    });
    return this.shippingMethodRepo.save(method);
  }

  async updateShippingMethod(id: string, dto: Partial<CreateShippingMethodDto>) {
    const method = await this.getShippingMethodById(id);
    Object.assign(method, dto);
    return this.shippingMethodRepo.save(method);
  }

  async deleteShippingMethod(id: string) {
    const method = await this.getShippingMethodById(id);
    method.status = 'INACTIVE';
    return this.shippingMethodRepo.save(method);
  }

  // ========== Quote Management ==========
  async quote(dto: ShippingQuoteDto, methodId?: string) {
    // Get active shipping methods
    let methods: ShippingMethod[];
    if (methodId) {
      const method = await this.getShippingMethodById(methodId);
      methods = [method];
    } else {
      methods = await this.shippingMethodRepo.find({
        where: { status: 'ACTIVE' },
      });
    }

    if (methods.length === 0) {
      throw new NotFoundException('No active shipping methods found');
    }

    // Calculate quotes for each method
    const quotes = await Promise.all(
      methods.map(async (method) => {
        const totalFee = this.calculateShippingFee(dto.items, method);
        const quote = this.shippingQuoteRepo.create({
          shippingMethodId: method.id,
          status: 'PENDING',
          totalFee,
          estimatedDays: method.estimatedDays,
          originAddress: dto.address,
          destinationAddress: dto.address,
          breakdown: this.calculateBreakdown(dto.items, method),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        });
        const savedQuote = await this.shippingQuoteRepo.save(quote);
        return {
          quoteId: savedQuote.id,
          methodId: method.id,
          methodName: method.name,
          methodType: method.type,
          totalFee,
          estimatedDays: method.estimatedDays,
          expiresAt: savedQuote.expiresAt,
        };
      }),
    );

    return {
      quotes,
      totalQuotes: quotes.length,
    };
  }

  private calculateShippingFee(items: ShippingQuoteDto['items'], method: ShippingMethod): number {
    let totalFee = Number(method.baseFee);

    for (const item of items) {
      // Per item fee
      if (method.perItemFee) {
        totalFee += Number(method.perItemFee) * item.quantity;
      }

      // Per kg fee
      if (method.perKgFee && item.weight) {
        totalFee += Number(method.perKgFee) * item.weight * item.quantity;
      }
    }

    return totalFee;
  }

  private calculateBreakdown(items: ShippingQuoteDto['items'], method: ShippingMethod) {
    const feesBySeller: Record<string, number> = {};
    const baseFeePerSeller = Number(method.baseFee) / items.length;

    for (const item of items) {
      const sellerId = item.sellerId || 'default';
      let fee = baseFeePerSeller;

      if (method.perItemFee) {
        fee += Number(method.perItemFee) * item.quantity;
      }

      if (method.perKgFee && item.weight) {
        fee += Number(method.perKgFee) * item.weight * item.quantity;
      }

      feesBySeller[sellerId] = (feesBySeller[sellerId] || 0) + fee;
    }

    return feesBySeller;
  }

  async getQuoteById(id: string) {
    const quote = await this.shippingQuoteRepo.findOne({
      where: { id },
      relations: ['shippingMethod'],
    });
    if (!quote) {
      throw new NotFoundException(`Shipping quote with ID ${id} not found`);
    }
    return quote;
  }

  async acceptQuote(id: string) {
    const quote = await this.getQuoteById(id);
    if (quote.status !== 'PENDING') {
      throw new BadRequestException(`Quote is already ${quote.status}`);
    }
    if (quote.expiresAt && quote.expiresAt < new Date()) {
      quote.status = 'EXPIRED';
      await this.shippingQuoteRepo.save(quote);
      throw new BadRequestException('Quote has expired');
    }
    quote.status = 'ACCEPTED';
    return this.shippingQuoteRepo.save(quote);
  }

  // ========== Shipping Order Management ==========
  async createShippingOrder(dto: CreateShippingOrderDto) {
    const quote = await this.getQuoteById(dto.quoteId);
    if (quote.status !== 'ACCEPTED') {
      throw new BadRequestException('Quote must be accepted before creating order');
    }

    // Check if order already exists
    const existingOrder = await this.shippingOrderRepo.findOne({
      where: { orderId: dto.orderId },
    });
    if (existingOrder) {
      throw new BadRequestException(`Shipping order for order ${dto.orderId} already exists`);
    }

    const trackingNumber = `SHIP-${Date.now()}-${uuidv4().substring(0, 8).toUpperCase()}`;

    const order = this.shippingOrderRepo.create({
      orderId: dto.orderId,
      quoteId: dto.quoteId,
      status: 'PENDING',
      shippingFee: quote.totalFee,
      trackingNumber,
      carrier: dto.carrier || 'Default Carrier',
      originAddress: dto.originAddress || quote.originAddress,
      destinationAddress: dto.destinationAddress,
      recipientName: dto.recipientName,
      recipientPhone: dto.recipientPhone,
      trackingHistory: [
        {
          status: 'PENDING',
          timestamp: new Date(),
          note: 'Shipping order created',
        },
      ],
    });

    const savedOrder = await this.shippingOrderRepo.save(order);

    // Emit Kafka event
    await this.kafka.emit('shipping.order.created', {
      orderId: savedOrder.orderId,
      shippingOrderId: savedOrder.id,
      trackingNumber: savedOrder.trackingNumber,
      shippingFee: Number(savedOrder.shippingFee),
      status: savedOrder.status,
    });

    return savedOrder;
  }

  async getShippingOrderByOrderId(orderId: string) {
    const order = await this.shippingOrderRepo.findOne({
      where: { orderId },
      relations: ['quote', 'quote.shippingMethod'],
    });
    if (!order) {
      throw new NotFoundException(`Shipping order for order ${orderId} not found`);
    }
    return order;
  }

  async getShippingOrderByTrackingNumber(trackingNumber: string) {
    const order = await this.shippingOrderRepo.findOne({
      where: { trackingNumber },
      relations: ['quote', 'quote.shippingMethod'],
    });
    if (!order) {
      throw new NotFoundException(`Shipping order with tracking number ${trackingNumber} not found`);
    }
    return order;
  }

  // ========== Tracking Management ==========
  async updateTracking(trackingNumber: string, dto: UpdateTrackingDto) {
    const order = await this.getShippingOrderByTrackingNumber(trackingNumber);

    const previousStatus = order.status;
    order.status = dto.status;

    // Update tracking history
    if (!order.trackingHistory) {
      order.trackingHistory = [];
    }
    order.trackingHistory.push({
      status: dto.status,
      location: dto.location,
      timestamp: new Date(),
      note: dto.note,
    });

    // Update timestamps based on status
    if (dto.status === 'CONFIRMED' && !order.shippedAt) {
      order.shippedAt = new Date();
    }
    if (dto.status === 'DELIVERED' && !order.deliveredAt) {
      order.deliveredAt = new Date();
    }

    const savedOrder = await this.shippingOrderRepo.save(order);

    // Emit Kafka event if status changed
    if (previousStatus !== dto.status) {
      await this.kafka.emit('shipping.order.status.updated', {
        orderId: savedOrder.orderId,
        shippingOrderId: savedOrder.id,
        trackingNumber: savedOrder.trackingNumber,
        previousStatus,
        newStatus: dto.status,
        timestamp: new Date().toISOString(),
      });
    }

    return savedOrder;
  }

  async getAllShippingOrders(status?: ShippingOrderStatus) {
    const where = status ? { status } : {};
    return this.shippingOrderRepo.find({
      where,
      relations: ['quote', 'quote.shippingMethod'],
      order: { createdAt: 'DESC' },
    });
  }
}


