import { DataSource } from 'typeorm';
import { Payment, PaymentStatus, PaymentMethod, PaymentProvider } from '../database/entities/payment.entity';

export async function seedDatabase(dataSource: DataSource) {
  const paymentRepo = dataSource.getRepository(Payment);

  console.log('🌱 Starting payment seed data...');

  const seedOrderIds = [
    'seed-order-1', 'seed-order-2', 'seed-order-3',
    'seed-order-4', 'seed-order-5', 'seed-order-6',
    'seed-order-7', 'seed-order-8',
  ];
  const existingPayments = await paymentRepo.find({
    where: seedOrderIds.map((id) => ({ orderId: id })),
  });
  if (existingPayments.length > 0) {
    await paymentRepo.remove(existingPayments);
    console.log(`🗑️  Removed ${existingPayments.length} existing seed payments`);
  }

  const samplePayments = [
    // ── CARD ──────────────────────────────────────────────
    paymentRepo.create({
      orderId: 'seed-order-1',
      amount: 150000,
      status: 'SUCCESS' as PaymentStatus,
      method: 'CARD' as PaymentMethod,
      provider: 'VNPAY' as PaymentProvider,
      providerTxnId: 'seed-vnpay-card-001',
      idempotencyKey: 'seed-idempotency-001',
      providerResponse: JSON.stringify({
        code: '00',
        message: 'Giao dịch thẻ thành công',
        cardType: 'VISA',
        last4: '4242',
      }),
    }),
    paymentRepo.create({
      orderId: 'seed-order-2',
      amount: 500000,
      status: 'SUCCESS' as PaymentStatus,
      method: 'CARD' as PaymentMethod,
      provider: 'STRIPE' as PaymentProvider,
      providerTxnId: 'seed-stripe-card-002',
      idempotencyKey: 'seed-idempotency-002',
      refundedAmount: 100000,
      providerResponse: JSON.stringify({
        chargeId: 'ch_mock_123456',
        status: 'succeeded',
        cardBrand: 'Mastercard',
        last4: '5678',
      }),
    }),

    // ── EWALLET ──────────────────────────────────────────
    paymentRepo.create({
      orderId: 'seed-order-3',
      amount: 250000,
      status: 'SUCCESS' as PaymentStatus,
      method: 'EWALLET' as PaymentMethod,
      provider: 'MOMO' as PaymentProvider,
      providerTxnId: 'seed-momo-ewallet-003',
      idempotencyKey: 'seed-idempotency-003',
      providerResponse: JSON.stringify({
        status: 'completed',
        walletName: 'MoMo',
        phone: '0912***789',
        transId: 'MOMO2025001234',
      }),
    }),
    paymentRepo.create({
      orderId: 'seed-order-4',
      amount: 300000,
      status: 'PARTIALLY_REFUNDED' as PaymentStatus,
      method: 'EWALLET' as PaymentMethod,
      provider: 'VNPAY' as PaymentProvider,
      providerTxnId: 'seed-vnpay-ewallet-004',
      idempotencyKey: 'seed-idempotency-004',
      refundedAmount: 150000,
      providerResponse: JSON.stringify({
        code: '00',
        walletName: 'VNPay QR',
        refundAmount: 150000,
      }),
    }),

    // ── BANK_TRANSFER ────────────────────────────────────
    paymentRepo.create({
      orderId: 'seed-order-5',
      amount: 1200000,
      status: 'SUCCESS' as PaymentStatus,
      method: 'BANK_TRANSFER' as PaymentMethod,
      provider: 'MOCK' as PaymentProvider,
      providerTxnId: 'seed-mock-bank-005',
      idempotencyKey: 'seed-idempotency-005',
      providerResponse: JSON.stringify({
        bankName: 'Vietcombank',
        accountNumber: '1234567890',
        accountHolder: 'CONG TY MOCK PAYMENT',
        transferContent: 'PAY seed-mock-bank-005',
        confirmedAt: '2025-03-20T10:30:00Z',
      }),
    }),
    paymentRepo.create({
      orderId: 'seed-order-6',
      amount: 75000,
      status: 'FAILED' as PaymentStatus,
      method: 'BANK_TRANSFER' as PaymentMethod,
      provider: 'MOCK' as PaymentProvider,
      providerTxnId: 'seed-mock-bank-006',
      idempotencyKey: 'seed-idempotency-006',
      providerResponse: JSON.stringify({
        error: 'TRANSFER_EXPIRED',
        message: 'Quá thời hạn chuyển khoản (24h)',
      }),
    }),

    // ── COD ──────────────────────────────────────────────
    paymentRepo.create({
      orderId: 'seed-order-7',
      amount: 350000,
      status: 'SUCCESS' as PaymentStatus,
      method: 'COD' as PaymentMethod,
      provider: 'MOCK' as PaymentProvider,
      providerTxnId: 'seed-mock-cod-007',
      idempotencyKey: 'seed-idempotency-007',
      providerResponse: JSON.stringify({
        method: 'COD',
        note: 'Thu tiền khi giao hàng',
        collectedAt: '2025-03-19T14:22:00Z',
        deliveryPerson: 'Shipper Mock #42',
      }),
    }),
    paymentRepo.create({
      orderId: 'seed-order-8',
      amount: 890000,
      status: 'REFUNDED' as PaymentStatus,
      method: 'COD' as PaymentMethod,
      provider: 'MOCK' as PaymentProvider,
      providerTxnId: 'seed-mock-cod-008',
      idempotencyKey: 'seed-idempotency-008',
      refundedAmount: 890000,
      providerResponse: JSON.stringify({
        method: 'COD',
        note: 'Khách trả hàng — hoàn tiền mặt tại chỗ',
        refundedAt: '2025-03-18T09:15:00Z',
      }),
    }),
  ];

  const savedPayments = await paymentRepo.save(samplePayments);
  console.log(`✅ Created ${savedPayments.length} sample payments`);

  const summary = savedPayments.reduce((acc, p) => {
    const key = p.method || 'UNKNOWN';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  console.log('   📊 Breakdown:', JSON.stringify(summary));

  console.log('🎉 Payment seed data completed!');
  return { payments: savedPayments };
}
