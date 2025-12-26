import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product } from './schemas/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductRepository {
  constructor(
    @InjectModel(Product.name)
    private readonly model: Model<Product>,
  ) {}

  create(data: CreateProductDto): Promise<Product> {
    return this.model.create(data);
  }

  findAll(search?: string): Promise<Product[]> {
    const filter = search ? { name: new RegExp(search, 'i') } : {};
    return this.model.find(filter).exec();
  }

  findById(id: string): Promise<Product | null> {
    return this.model.findById(id).exec();
  }

  update(id: string, data: UpdateProductDto): Promise<Product | null> {
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  decrementStock(id: string, quantity: number): Promise<Product | null> {
    return this.model.findByIdAndUpdate(
      id,
      { $inc: { stock: -quantity } },
      { new: true },
    ).exec();
  }

  incrementStock(id: string, quantity: number): Promise<Product | null> {
    return this.model.findByIdAndUpdate(
      id,
      { $inc: { stock: quantity } },
      { new: true },
    ).exec();
  }
}


