import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cart } from './schemas/cart.schema';
import { CartItemDto } from './dto/cart-item.dto';

@Injectable()
export class CartRepository {
  constructor(
    @InjectModel(Cart.name)
    private readonly model: Model<Cart>,
  ) {}

  async getByUserId(userId: string): Promise<Cart | null> {
    return this.model.findOne({ userId }).exec();
  }

  async upsertItem(userId: string, item: CartItemDto): Promise<Cart> {
    const cart =
      (await this.model.findOne({ userId }).exec()) ||
      (await this.model.create({ userId, items: [] }));

    const existing = cart.items.find((i) => i.productId === item.productId);
    if (existing) {
      existing.quantity = item.quantity;
      existing.price = item.price;
    } else {
      cart.items.push(item as any);
    }
    return cart.save();
  }

  async removeItem(userId: string, productId: string): Promise<Cart | null> {
    const cart = await this.model.findOne({ userId }).exec();
    if (!cart) return null;
    cart.items = cart.items.filter((i) => i.productId !== productId);
    return cart.save();
  }
}


