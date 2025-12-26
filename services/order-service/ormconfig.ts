import { DataSource } from 'typeorm';
import { Order } from './src/database/entities/order.entity';
import { OrderItem } from './src/database/entities/order-item.entity';
import { OrderHistory } from './src/database/entities/order-history.entity';

export default new DataSource({
  type: 'postgres',
  host: process.env.ORDER_DB_HOST || 'localhost',
  port: +(process.env.ORDER_DB_PORT || 5432),
  username: process.env.ORDER_DB_USER || 'order_user',
  password: process.env.ORDER_DB_PASSWORD || 'order_password',
  database: process.env.ORDER_DB_NAME || 'order_db',
  entities: [Order, OrderItem, OrderHistory],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});

