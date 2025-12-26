export class Product {
  constructor(
    public readonly id: string,
    public name: string,
    public price: number,
    public stock: number,
    public description?: string,
    public category?: string,
    public brand?: string,
    public sellerId?: string,
  ) {}
}


