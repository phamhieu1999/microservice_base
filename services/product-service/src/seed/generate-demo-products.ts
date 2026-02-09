import type { Product } from '../modules/product/schemas/product.schema';

// Simple placeholder images (you can swap to your own CDN later)
const IMAGE_BASE_URL = 'https://picsum.photos';

const categories = [
  { name: 'Electronics', brands: ['Apple', 'Samsung', 'Sony', 'Xiaomi'] },
  { name: 'Clothing', brands: ['Nike', 'Adidas', 'Uniqlo', 'Zara'] },
  { name: 'Home & Kitchen', brands: ['Lock&Lock', 'Sunhouse', 'Philips'] },
  { name: 'Beauty & Personal Care', brands: ['La Roche-Posay', 'Innisfree', 'Laneige'] },
  { name: 'Toys & Games', brands: ['LEGO', 'Hasbro', 'Mattel'] },
];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

export function generateDemoProducts(count: number): Partial<Product>[] {
  const products: Partial<Product>[] = [];

  for (let i = 1; i <= count; i++) {
    const category = pickRandom(categories);
    const brand = pickRandom(category.brands);
    const price = randomInt(5, 200) * 100_000;
    const stock = randomInt(5, 200);
    const width = 600 + (i % 5) * 10;
    const height = 600 + (i % 7) * 10;

    products.push({
      name: `${brand} Demo Product #${i}`,
      description: `Sản phẩm demo #${i} thuộc danh mục ${category.name}, thương hiệu ${brand}. Dùng để test UI và luồng mua hàng.`,
      price,
      stock,
      category: category.name,
      brand,
      sellerId: `demo_seller_${String((i % 10) + 1).padStart(3, '0')}`,
      lowStockThreshold: 10,
      // Advance: store image URL in a custom field if later added to schema
      // imageUrl: `${IMAGE_BASE_URL}/${width}/${height}?random=${i}`,
    } as Partial<Product>);
  }

  return products;
}


