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

  async onModuleInit() {
    try {
      // Check if index exists, create if not
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
      {
        range: {
          stock: { gt: 0 },
        },
      },
    ];

    if (filters?.category) {
      must.push({ term: { category: filters.category } });
    }

    if (filters?.brand) {
      must.push({ term: { brand: filters.brand } });
    }

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
          query: {
            bool: {
              must,
            },
          },
          from: skip,
          size: limit,
          highlight: {
            fields: {
              name: {},
              description: {},
            },
          },
        },
      });

      return result.body.hits.hits.map((hit: any) => ({
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

      return result.body.hits.hits.map((hit: any) => ({
        productId: hit._source.productId,
        name: hit._source.name,
        price: hit._source.price,
      }));
    } catch (err) {
      this.logger.error('Error autocomplete', err as Error);
      return [];
    }
  }

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

      return result.body.hits.hits.map((hit: any) => hit._source);
    } catch (err) {
      this.logger.error('Error searching by category', err as Error);
      return [];
    }
  }

  async searchByBrand(brand: string, limit = 20, skip = 0) {
    try {
      const result = await this.client.search({
        index: this.indexName,
        body: {
          query: {
            bool: {
              must: [
                { term: { brand } },
                { range: { stock: { gt: 0 } } },
              ],
            },
          },
          from: skip,
          size: limit,
        },
      });

      return result.body.hits.hits.map((hit: any) => hit._source);
    } catch (err) {
      this.logger.error('Error searching by brand', err as Error);
      return [];
    }
  }
}

