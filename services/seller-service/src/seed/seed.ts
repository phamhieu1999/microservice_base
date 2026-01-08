import { DataSource } from 'typeorm';
import { Seller } from '../database/entities/seller.entity';
import { Shop } from '../database/entities/shop.entity';

export async function seedDatabase(dataSource: DataSource) {
  const sellerRepo = dataSource.getRepository(Seller);
  const shopRepo = dataSource.getRepository(Shop);

  console.log('🌱 Starting seed data...');

  // Clear existing data (delete shops first due to foreign key constraint)
  const existingShops = await shopRepo.find();
  if (existingShops.length > 0) {
    await shopRepo.remove(existingShops);
  }
  const existingSellers = await sellerRepo.find();
  if (existingSellers.length > 0) {
    await sellerRepo.remove(existingSellers);
  }

  // Create sellers
  const sellers = [
    sellerRepo.create({
      userId: 'user-1',
      status: 'APPROVED',
    }),
    sellerRepo.create({
      userId: 'user-2',
      status: 'APPROVED',
    }),
    sellerRepo.create({
      userId: 'user-3',
      status: 'PENDING',
    }),
    sellerRepo.create({
      userId: 'user-4',
      status: 'REJECTED',
    }),
  ];

  const savedSellers = await sellerRepo.save(sellers);
  console.log(`✅ Created ${savedSellers.length} sellers`);

  // Create shops
  const shops = [
    shopRepo.create({
      sellerId: savedSellers[0].id,
      name: 'Tech Store',
      avatarUrl: 'https://example.com/tech-store.jpg',
      address: '123 Tech Street, Ho Chi Minh City',
    }),
    shopRepo.create({
      sellerId: savedSellers[0].id,
      name: 'Fashion Boutique',
      avatarUrl: 'https://example.com/fashion.jpg',
      address: '456 Fashion Avenue, Hanoi',
    }),
    shopRepo.create({
      sellerId: savedSellers[1].id,
      name: 'Electronics Hub',
      avatarUrl: 'https://example.com/electronics.jpg',
      address: '789 Electronics Road, Da Nang',
    }),
    shopRepo.create({
      sellerId: savedSellers[1].id,
      name: 'Home & Garden',
      avatarUrl: 'https://example.com/home-garden.jpg',
      address: '321 Garden Lane, Can Tho',
    }),
    shopRepo.create({
      sellerId: savedSellers[1].id,
      name: 'Sports Equipment',
      avatarUrl: 'https://example.com/sports.jpg',
      address: '654 Sports Boulevard, Hai Phong',
    }),
  ];

  const savedShops = await shopRepo.save(shops);
  console.log(`✅ Created ${savedShops.length} shops`);

  console.log('🎉 Seed data completed!');
  return { sellers: savedSellers, shops: savedShops };
}

