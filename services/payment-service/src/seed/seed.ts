import { DataSource } from 'typeorm';
import { Payment, PaymentStatus, PaymentMethod, PaymentProvider } from '../database/entities/payment.entity';

export async function seedDatabase(dataSource: DataSource) {
  const paymentRepo = dataSource.getRepository(Payment);

  console.log('🌱 Starting payment seed data...');

  // Clear existing seed data (only test payments)
  const existingPayments = await paymentRepo.find({
    where: [
      { orderId: 'seed-order-1' },
      { orderId: 'seed-order-2' },
      { orderId: 'seed-order-3' },
    ],
  });
  if (existingPayments.length > 0) {
    await paymentRepo.remove(existingPayments);
    console.log(`🗑️  Removed ${existingPayments.length} existing seed payments`);
  }

  // Create sample payments for testing
  const samplePayments = [
    paymentRepo.create({
      orderId: 'seed-order-1',
      amount: 150000,
      status: 'SUCCESS' as PaymentStatus,
      method: 'CARD' as PaymentMethod,
      provider: 'VNPAY' as PaymentProvider,
      providerTxnId: 'seed-vnpay-txn-001',
      idempotencyKey: 'seed-idempotency-001',
      providerResponse: JSON.stringify({ code: '00', message: 'Success' }),
    }),
    paymentRepo.create({
      orderId: 'seed-order-2',
      amount: 250000,
      status: 'PENDING' as PaymentStatus,
      method: 'EWALLET' as PaymentMethod,
      provider: 'MOMO' as PaymentProvider,
      providerTxnId: 'seed-momo-txn-002',
      idempotencyKey: 'seed-idempotency-002',
      providerResponse: JSON.stringify({ status: 'pending', qrCode: 'sample-qr-code' }),
    }),
    paymentRepo.create({
      orderId: 'seed-order-3',
      amount: 75000,
      status: 'FAILED' as PaymentStatus,
      method: 'BANK_TRANSFER' as PaymentMethod,
      provider: 'MOCK' as PaymentProvider,
      providerTxnId: 'seed-mock-txn-003',
      idempotencyKey: 'seed-idempotency-003',
      providerResponse: JSON.stringify({ error: 'Insufficient funds' }),
    }),
    paymentRepo.create({
      orderId: 'seed-order-4',
      amount: 500000,
      status: 'SUCCESS' as PaymentStatus,
      method: 'CARD' as PaymentMethod,
      provider: 'STRIPE' as PaymentProvider,
      providerTxnId: 'seed-stripe-txn-004',
      idempotencyKey: 'seed-idempotency-004',
      refundedAmount: 100000,
      providerResponse: JSON.stringify({ chargeId: 'ch_123456', status: 'succeeded' }),
    }),
    paymentRepo.create({
      orderId: 'seed-order-5',
      amount: 300000,
      status: 'PARTIALLY_REFUNDED' as PaymentStatus,
      method: 'EWALLET' as PaymentMethod,
      provider: 'VNPAY' as PaymentProvider,
      providerTxnId: 'seed-vnpay-txn-005',
      idempotencyKey: 'seed-idempotency-005',
      refundedAmount: 150000,
      providerResponse: JSON.stringify({ code: '00', refundAmount: 150000 }),
    }),
  ];

  const savedPayments = await paymentRepo.save(samplePayments);
  console.log(`✅ Created ${savedPayments.length} sample payments`);

  console.log('🎉 Payment seed data completed!');
  return { payments: savedPayments };
}

