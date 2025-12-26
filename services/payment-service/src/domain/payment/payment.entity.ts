export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

export class Payment {
  constructor(
    public readonly id: string,
    public readonly orderId: string,
    public amount: number,
    public status: PaymentStatus,
  ) {}
}


