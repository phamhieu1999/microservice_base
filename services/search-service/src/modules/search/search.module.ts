import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductIndex, ProductIndexSchema } from './schemas/product-index.schema';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { ElasticsearchService } from './elasticsearch.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: ProductIndex.name, schema: ProductIndexSchema }])],
  controllers: [SearchController],
  providers: [SearchService, ElasticsearchService],
  exports: [SearchService],
})
export class SearchModule {}

