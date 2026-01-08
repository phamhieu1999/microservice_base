import { DataSource } from 'typeorm';
import { ShippingMethod } from '../database/entities/shipping-method.entity';

export async function seedDatabase(dataSource: DataSource) {
  const shippingMethodRepo = dataSource.getRepository(ShippingMethod);

  console.log('🌱 Starting seed data...');

  // Clear existing data
  const existingMethods = await shippingMethodRepo.find();
  if (existingMethods.length > 0) {
    await shippingMethodRepo.remove(existingMethods);
  }

  // Create shipping methods
  const shippingMethods = [
    shippingMethodRepo.create({
      name: 'Standard Shipping',
      type: 'STANDARD',
      baseFee: 15000,
      perItemFee: 2000,
      perKgFee: 5000,
      estimatedDays: 3,
      status: 'ACTIVE',
      description: 'Standard delivery within 3-5 business days',
    }),
    shippingMethodRepo.create({
      name: 'Express Shipping',
      type: 'EXPRESS',
      baseFee: 30000,
      perItemFee: 5000,
      perKgFee: 10000,
      estimatedDays: 1,
      status: 'ACTIVE',
      description: 'Express delivery within 1-2 business days',
    }),
    shippingMethodRepo.create({
      name: 'Overnight Shipping',
      type: 'OVERNIGHT',
      baseFee: 50000,
      perItemFee: 10000,
      perKgFee: 15000,
      estimatedDays: 1,
      status: 'ACTIVE',
      description: 'Overnight delivery next business day',
    }),
    shippingMethodRepo.create({
      name: 'Same Day Delivery',
      type: 'SAME_DAY',
      baseFee: 80000,
      perItemFee: 15000,
      perKgFee: 20000,
      estimatedDays: 0,
      status: 'ACTIVE',
      description: 'Same day delivery (order before 2 PM)',
    }),
    shippingMethodRepo.create({
      name: 'Economy Shipping',
      type: 'STANDARD',
      baseFee: 10000,
      perItemFee: 1000,
      perKgFee: 3000,
      estimatedDays: 7,
      status: 'ACTIVE',
      description: 'Economy delivery within 5-7 business days',
    }),
  ];

  const savedMethods = await shippingMethodRepo.save(shippingMethods);
  console.log(`✅ Created ${savedMethods.length} shipping methods`);

  console.log('🎉 Seed data completed!');
  return { shippingMethods: savedMethods };
}

