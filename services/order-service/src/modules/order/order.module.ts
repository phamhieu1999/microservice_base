import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../../database/entities/order.entity';
import { OrderItem } from '../../database/entities/order-item.entity';
import { OrderHistory } from '../../database/entities/order-history.entity';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { OrderRepository } from './order.repository';
import { OrderTypeormRepository } from '../../infrastructure/persistence/typeorm/order.repository.typeorm';
import { CreateOrderUseCase } from '../../application/order/use-cases/create-order.usecase';
import { GetOrderUseCase } from '../../application/order/use-cases/get-order.usecase';
import { MarkPaidUseCase } from '../../application/order/use-cases/mark-paid.usecase';
import { MarkCancelledUseCase } from '../../application/order/use-cases/mark-cancelled.usecase';
import { CancelOrderUseCase } from '../../application/order/use-cases/cancel-order.usecase';
import { UpdateOrderStatusUseCase } from '../../application/order/use-cases/update-order-status.usecase';
import { TracingService } from '../../common/tracing.service';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem, OrderHistory])],
  controllers: [OrderController],
  providers: [
    OrderService,
    OrderRepository, // tạm thời giữ để không phá code cũ
    OrderTypeormRepository,
    { provide: 'IOrderRepository', useExisting: OrderTypeormRepository },
    CreateOrderUseCase,
    GetOrderUseCase,
    MarkPaidUseCase,
    MarkCancelledUseCase,
    CancelOrderUseCase,
    UpdateOrderStatusUseCase,
    TracingService,
  ],
  exports: [
    OrderService,
    CreateOrderUseCase,
    GetOrderUseCase,
    MarkPaidUseCase,
    MarkCancelledUseCase,
    CancelOrderUseCase,
    UpdateOrderStatusUseCase,
  ],
})
export class OrderModule {}


