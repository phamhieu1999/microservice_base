# Phân tích chi tiết phần Elasticsearch – Code cụ thể

Tài liệu này phân tích từng phần tích hợp Elasticsearch trong `search-service`, kèm trích dẫn code và đường dẫn file.

---

## 1. Cấu trúc và khởi tạo

### 1.1 Module đăng ký (`search.module.ts`)

**File:** `services/search-service/src/modules/search/search.module.ts`

```typescript
@Module({
  imports: [MongooseModule.forFeature([{ name: ProductIndex.name, schema: ProductIndexSchema }])],
  controllers: [SearchController],
  providers: [SearchService, ElasticsearchService],  // ES được inject vào SearchService
  exports: [SearchService],
})
export class SearchModule {}
```

- `ElasticsearchService` được khai báo trong `providers` → Nest inject vào `SearchService` (nếu có).
- Chỉ export `SearchService`; controller gọi qua `SearchService`, không gọi trực tiếp ES.

---

### 1.2 Client và cấu hình (`elasticsearch.service.ts`)

**File:** `services/search-service/src/modules/search/elasticsearch.service.ts`

**Khởi tạo client (dòng 1–16):**

```typescript
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Client, ClientOptions } from '@elastic/elasticsearch';

@Injectable()
export class ElasticsearchService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ElasticsearchService.name);
  private readonly client: Client;
  private readonly indexName = 'products';

  constructor() {
    const node = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';
    const clientOptions: ClientOptions = {
      node,
    };
    this.client = new Client(clientOptions);
  }
```

- Index cố định: `products`.
- URL lấy từ `ELASTICSEARCH_URL`, mặc định `http://localhost:9200`.

**Lifecycle – tạo index khi khởi động (dòng 19–35):**

```typescript
  async onModuleInit() {
    try {
      const exists = await this.client.indices.exists({ index: this.indexName });
      if (!exists) {
        await this.createIndex();
        this.logger.log(`Created Elasticsearch index: ${this.indexName}`);
      } else {
        this.logger.log(`Elasticsearch index already exists: ${this.indexName}`);
      }
    } catch (err) {
      this.logger.error('Error initializing Elasticsearch', err as Error);
    }
  }

  async onModuleDestroy() {
    await this.client.close();
  }
```

- Nếu index chưa tồn tại → gọi `createIndex()`.
- Khi tắt module → đóng client.

---

## 2. Index mapping và analyzer

**File:** `services/search-service/src/modules/search/elasticsearch.service.ts` (dòng 37–79)

```typescript
  private async createIndex() {
    await this.client.indices.create({
      index: this.indexName,
      body: {
        mappings: {
          properties: {
            productId: { type: 'keyword' },
            name: {
              type: 'text',
              analyzer: 'standard',
              fields: {
                keyword: { type: 'keyword' },
              },
            },
            description: { type: 'text', analyzer: 'standard' },
            price: { type: 'float' },
            stock: { type: 'integer' },
            category: { type: 'keyword' },
            brand: { type: 'keyword' },
            sellerId: { type: 'keyword' },
            searchText: { type: 'text', analyzer: 'standard' },
          },
        },
        settings: {
          analysis: {
            analyzer: {
              autocomplete: {
                type: 'custom',
                tokenizer: 'standard',
                filter: ['lowercase', 'autocomplete_filter'],
              },
            },
            filter: {
              autocomplete_filter: {
                type: 'edge_ngram',
                min_gram: 2,
                max_gram: 20,
              },
            },
          },
        },
      },
    });
  }
```

**Giải thích nhanh:**

- **keyword:** dùng cho filter chính xác (category, brand, sellerId, productId).
- **text + standard:** full-text trên name, description, searchText; `name.keyword` để sort/aggregate.
- **autocomplete:** custom analyzer với edge_ngram (2–20 ký tự) cho gợi ý khi gõ từ đầu.

---

## 3. Indexing sản phẩm

### 3.1 ElasticsearchService.indexProduct

**File:** `services/search-service/src/modules/search/elasticsearch.service.ts` (dòng 81–120)

```typescript
  async indexProduct(product: {
    id: string;
    name: string;
    description?: string;
    price: number;
    stock: number;
    category?: string;
    brand?: string;
    sellerId?: string;
  }) {
    const searchText = [
      product.name,
      product.description,
      product.category,
      product.brand,
    ]
      .filter(Boolean)
      .join(' ');

    try {
      await this.client.index({
        index: this.indexName,
        id: product.id,
        body: {
          productId: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          stock: product.stock,
          category: product.category,
          brand: product.brand,
          sellerId: product.sellerId,
          searchText,
        },
      });
      this.logger.log(`Indexed product: ${product.id}`);
    } catch (err) {
      this.logger.error(`Error indexing product ${product.id}`, err as Error);
    }
  }
```

- Document id = `product.id`.
- `searchText` = nối name, description, category, brand để search một trường tổng hợp.

### 3.2 SearchService – ghi MongoDB + ES + invalidate cache

**File:** `services/search-service/src/modules/search/search.service.ts` (dòng 12–19, 22–74)

**Quyết định dùng ES (constructor):**

```typescript
  constructor(
    @InjectModel(ProductIndex.name)
    private readonly productIndexModel: Model<ProductIndexDocument>,
    @Optional() private readonly cache?: CacheService,
    @Optional() private readonly elasticsearch?: ElasticsearchService,
  ) {
    this.useElasticsearch = !!elasticsearch && process.env.USE_ELASTICSEARCH === 'true';
  }
```

**indexProduct – luồng ghi:**

```typescript
  async indexProduct(product: { ... }) {
    const searchText = [ product.name, product.description, product.category, product.brand ]
      .filter(Boolean).join(' ');

    // 1) Luôn ghi MongoDB (fallback khi tắt ES)
    await this.productIndexModel.findOneAndUpdate(
      { productId: product.id },
      { productId, name, description, price, stock, category, brand, sellerId, searchText },
      { upsert: true },
    );

    // 2) Ghi ES nếu bật
    if (this.useElasticsearch && this.elasticsearch) {
      await this.elasticsearch.indexProduct(product);
    }

    // 3) Invalidate cache theo category/brand và search chung
    if (this.cache) {
      if (product.category) await this.cache.invalidatePattern(`search:category:${product.category}:`);
      if (product.brand) await this.cache.invalidatePattern(`search:brand:${product.brand}:`);
      await this.cache.invalidatePattern('search:');
    }
  }
```

### 3.3 Kafka consumer – nguồn sự kiện index

**File:** `services/search-service/src/kafka/product-events.consumer.ts` (dòng 18–47)

```typescript
  async onModuleInit() {
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: 'product.created', fromBeginning: true });
    await this.consumer.subscribe({ topic: 'product.updated', fromBeginning: true });

    await this.consumer.run({
      eachMessage: async ({ topic, message }) => {
        const payload = message.value ? JSON.parse(message.value.toString()) : null;
        if (!payload) return;

        try {
          if (topic === 'product.created' || topic === 'product.updated') {
            await this.searchService.indexProduct({
              id: payload.id,
              name: payload.name || '',
              description: payload.description,
              price: payload.price || 0,
              stock: payload.stock || 0,
              category: payload.category,
              brand: payload.brand,
              sellerId: payload.sellerId,
            });
            this.logger.log(`Indexed product: ${payload.id} from ${topic}`);
          }
        } catch (err) {
          this.logger.error(`Error handling ${topic}`, err as Error);
        }
      },
    });
  }
```

- Chỉ xử lý `product.created` và `product.updated` → gọi `SearchService.indexProduct` → từ đó mới ghi ES (khi `USE_ELASTICSEARCH === 'true'`).

---

## 4. Xóa sản phẩm

### 4.1 ElasticsearchService.removeProduct

**File:** `services/search-service/src/modules/search/elasticsearch.service.ts` (dòng 122–131)

```typescript
  async removeProduct(productId: string) {
    try {
      await this.client.delete({
        index: this.indexName,
        id: productId,
      });
      this.logger.log(`Removed product from index: ${productId}`);
    } catch (err) {
      this.logger.error(`Error removing product ${productId}`, err as Error);
    }
  }
```

### 4.2 SearchService.removeProduct – chưa gọi ES

**File:** `services/search-service/src/modules/search/search.service.ts` (dòng 75–77)

```typescript
  async removeProduct(productId: string) {
    await this.productIndexModel.deleteOne({ productId });
  }
```

- Hiện chỉ xóa trên MongoDB; **chưa gọi** `this.elasticsearch?.removeProduct(productId)`.
- Để đồng bộ khi xóa sản phẩm: cần thêm gọi ES ở đây và/hoặc subscribe topic `product.deleted` trong consumer.

---

## 5. Full-text search (có filter + highlight)

**File:** `services/search-service/src/modules/search/elasticsearch.service.ts` (dòng 134–207)

```typescript
  async search(query: string, limit = 20, skip = 0, filters?: {
    category?: string;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
  }) {
    const must: any[] = [
      {
        multi_match: {
          query,
          fields: ['name^3', 'description^2', 'searchText'],
          type: 'best_fields',
          fuzziness: 'AUTO',
        },
      },
      { range: { stock: { gt: 0 } } },
    ];

    if (filters?.category) must.push({ term: { category: filters.category } });
    if (filters?.brand) must.push({ term: { brand: filters.brand } });
    if (filters?.minPrice !== undefined || filters?.maxPrice !== undefined) {
      const priceRange: any = {};
      if (filters.minPrice !== undefined) priceRange.gte = filters.minPrice;
      if (filters.maxPrice !== undefined) priceRange.lte = filters.maxPrice;
      must.push({ range: { price: priceRange } });
    }

    try {
      const result = await this.client.search({
        index: this.indexName,
        body: {
          query: { bool: { must } },
          from: skip,
          size: limit,
          highlight: {
            fields: { name: {}, description: {} },
          },
        },
      });

      return result.hits.hits.map((hit: any) => ({
        productId: hit._source.productId,
        name: hit._source.name,
        description: hit._source.description,
        price: hit._source.price,
        stock: hit._source.stock,
        category: hit._source.category,
        brand: hit._source.brand,
        sellerId: hit._source.sellerId,
        score: hit._score,
        highlight: hit.highlight,
      }));
    } catch (err) {
      this.logger.error('Error searching Elasticsearch', err as Error);
      return [];
    }
  }
```

- **multi_match:** name (boost 3), description (2), searchText; best_fields + fuzziness AUTO.
- **Filter:** stock > 0, category, brand, khoảng giá.
- **Highlight:** name, description.
- **Phân trang:** `from`/`size` = skip/limit.

SearchService gọi hàm này khi `useElasticsearch && this.elasticsearch` và cache kết quả 300s (xem search.service.ts dòng 91–108).

---

## 6. Autocomplete

**File:** `services/search-service/src/modules/search/elasticsearch.service.ts` (dòng 209–234)

```typescript
  async autocomplete(query: string, limit = 10) {
    try {
      const result = await this.client.search({
        index: this.indexName,
        body: {
          query: {
            match: {
              name: {
                query,
                analyzer: 'autocomplete',
              },
            },
          },
          size: limit,
        },
      });

      return result.hits.hits.map((hit: any) => ({
        productId: hit._source.productId,
        name: hit._source.name,
        price: hit._source.price,
      }));
    } catch (err) {
      this.logger.error('Error autocomplete', err as Error);
      return [];
    }
  }
```

- Dùng analyzer `autocomplete` (edge_ngram) trên field `name`.
- Lưu ý: mapping hiện tại khai báo analyzer trong `settings.analysis`, nhưng field `name` đang dùng `analyzer: 'standard'`. Để autocomplete đúng trên `name`, cần dùng **search_analyzer** trong query hoặc tạo sub-field `name.autocomplete` với analyzer `autocomplete` trong mapping và query vào sub-field đó (code hiện tại có thể hoạt động tùy phiên bản ES vì query có chỉ định analyzer).

---

## 7. Search theo category và brand

**File:** `services/search-service/src/modules/search/elasticsearch.service.ts`

**searchByCategory (dòng 236–257):**

```typescript
  async searchByCategory(category: string, limit = 20, skip = 0) {
    try {
      const result = await this.client.search({
        index: this.indexName,
        body: {
          query: {
            bool: {
              must: [
                { term: { category } },
                { range: { stock: { gt: 0 } } },
              ],
            },
          },
          from: skip,
          size: limit,
        },
      });
      return result.hits.hits.map((hit: any) => hit._source);
    } catch (err) {
      this.logger.error('Error searching by category', err as Error);
      return [];
    }
  }
```

**searchByBrand (dòng 259–281):** Tương tự, thay `term: { category }` bằng `term: { brand }`.

SearchService dùng hai hàm này khi bật ES và cache 300s (search.service.ts 161–177, 194–209).

---

## 8. API Controller

**File:** `services/search-service/src/modules/search/search.controller.ts`

- **GET /search** (dòng 10–61): query `q`, `limit`, `skip`, `category`, `brand`, `minPrice`, `maxPrice` → `this.service.search()` → trả về `results` + `total`, có `score` và `highlight`.
- **GET /search/autocomplete** (dòng 63–84): query `q`, `limit` → gọi trực tiếp `this.service.elasticsearch.autocomplete()` (cast `this.service as any`); nếu không có ES trả về `suggestions: []`.
- **GET /search/category** (dòng 86–122): `category`, `limit`, `skip` → `this.service.searchByCategory()`.
- **GET /search/brand** (dòng 124–159): `brand`, `limit`, `skip` → `this.service.searchByBrand()`.

---

## 9. Tóm tắt luồng dữ liệu

| Bước | Thành phần | Hành động |
|------|------------|-----------|
| 1 | product-service | Publish `product.created` / `product.updated` lên Kafka |
| 2 | ProductEventsConsumer | Consume message → `SearchService.indexProduct(payload)` |
| 3 | SearchService.indexProduct | Ghi MongoDB + (nếu USE_ELASTICSEARCH) `ElasticsearchService.indexProduct` + invalidate cache |
| 4 | ElasticsearchService.indexProduct | `client.index()` vào index `products` |
| 5 | Client gọi GET /search?q=... | SearchController → SearchService.search → (nếu ES) ElasticsearchService.search, cache Redis 300s |

---

## 10. Điểm cần bổ sung (đề xuất)

1. **removeProduct:** Trong `SearchService.removeProduct()` gọi thêm `this.elasticsearch?.removeProduct(productId)` khi có ES.
2. **product.deleted:** Consumer subscribe topic `product.deleted` và gọi `SearchService.removeProduct(payload.id)`.
3. **Autocomplete mapping:** Cân nhắc thêm sub-field `name.autocomplete` với analyzer `autocomplete` và query vào sub-field đó để hành vi rõ ràng hơn trên mọi phiên bản ES.

---

*Tài liệu tham chiếu code tại thời điểm phân tích; đường dẫn file tương đối từ root repo.*
