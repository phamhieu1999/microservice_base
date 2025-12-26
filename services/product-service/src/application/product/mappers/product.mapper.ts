import { Product as DomainProduct } from '../../../domain/product/product.entity';
import { Product as MongoProduct } from '../../../modules/product/schemas/product.schema';

export function mongoToDomain(doc: MongoProduct): DomainProduct {
  return new DomainProduct(
    (doc as any).id || (doc as any)._id?.toString(),
    doc.name,
    doc.price,
    doc.stock,
    doc.description,
    doc.category,
    doc.brand,
    (doc as any).sellerId,
  );
}


