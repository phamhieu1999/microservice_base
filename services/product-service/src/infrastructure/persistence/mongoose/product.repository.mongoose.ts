import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product as MongoProduct } from '../../../modules/product/schemas/product.schema';
import { IProductRepository } from '../../../domain/product/product.repository';
import { Product } from '../../../domain/product/product.entity';
import { mongoToDomain } from '../../../application/product/mappers/product.mapper';

@Injectable()
export class ProductMongooseRepository implements IProductRepository {
  constructor(
    @InjectModel(MongoProduct.name)
    private readonly model: Model<MongoProduct>,
  ) {}

  async create(product: Omit<Product, 'id'>): Promise<Product> {
    const created = await this.model.create({
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      category: product.category,
      brand: product.brand,
      sellerId: product.sellerId,
    });
    return mongoToDomain(created);
  }

  async findById(id: string): Promise<Product | null> {
    const doc = await this.model.findById(id).exec();
    return doc ? mongoToDomain(doc) : null;
  }

  async findAll(options?: {
    search?: string;
    category?: string;
    brand?: string;
    sellerId?: string;
    page?: number;
    limit?: number;
    sortBy?: 'name' | 'price' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    items: Product[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      search,
      category,
      brand,
      sellerId,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options || {};

    // Build filter
    const filter: any = {};
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
      ];
    }
    if (category) filter.category = category;
    if (brand) filter.brand = brand;
    if (sellerId) filter.sellerId = sellerId;

    // Build sort
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query with pagination and select only needed fields
    const [docs, total] = await Promise.all([
      this.model
        .find(filter)
        .select('id name price stock category brand sellerId status createdAt')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.model.countDocuments(filter).exec(),
    ]);

    return {
      items: docs.map((doc) => mongoToDomain(doc as any)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async decrementStock(id: string, quantity: number): Promise<Product> {
    const doc = await this.model.findByIdAndUpdate(
      id,
      { $inc: { stock: -quantity } },
      { new: true },
    ).exec();
    if (!doc) {
      throw new Error(`Product ${id} not found`);
    }
    return mongoToDomain(doc);
  }

  async incrementStock(id: string, quantity: number): Promise<Product> {
    const doc = await this.model.findByIdAndUpdate(
      id,
      { $inc: { stock: quantity } },
      { new: true },
    ).exec();
    if (!doc) {
      throw new Error(`Product ${id} not found`);
    }
    return mongoToDomain(doc);
  }
}


