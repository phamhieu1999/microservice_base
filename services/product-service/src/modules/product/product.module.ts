import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from './schemas/product.schema';
import { ProductController } from './product.controller';
import { ProductImageController } from './product-image.controller';
import { ProductService } from './product.service';
import { ProductRepository } from './product.repository';
import { CreateProductUseCase } from '../../application/product/use-cases/create-product.usecase';
import { GetProductUseCase } from '../../application/product/use-cases/get-product.usecase';
import { FindAllProductsUseCase } from '../../application/product/use-cases/find-all-products.usecase';
import { UpdateProductUseCase } from '../../application/product/use-cases/update-product.usecase';
import { ProductMongooseRepository } from '../../infrastructure/persistence/mongoose/product.repository.mongoose';
import { IProductRepository } from '../../domain/product/product.repository';

@Module({
  imports: [MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }])],
  controllers: [ProductController, ProductImageController],
  providers: [
    ProductService,
    ProductRepository,
    ProductMongooseRepository,
    { provide: 'IProductRepository', useExisting: ProductMongooseRepository as any as IProductRepository },
    CreateProductUseCase,
    GetProductUseCase,
    FindAllProductsUseCase,
    UpdateProductUseCase,
  ],
})
export class ProductModule {}


