import { Controller, Get, Header, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

/**
 * Product Image Controller
 * 
 * This controller provides endpoints for product images.
 * In production, these should return CDN URLs (CloudFront, Cloudflare, etc.)
 * 
 * CDN Benefits:
 * - Reduced server load
 * - Faster image delivery
 * - Better user experience
 * - Lower bandwidth costs
 */
@ApiTags('products')
@Controller('products')
export class ProductImageController {
  @Get(':id/image')
  @Header('Cache-Control', 'public, max-age=31536000') // 1 year cache
  @ApiOperation({ summary: 'Get product image URL (CDN)' })
  @ApiResponse({ status: 200, description: 'Product image URL' })
  async getProductImage(@Param('id') id: string) {
    // In production, return CDN URL
    // Example: https://cdn.example.com/products/{id}.jpg
    const cdnBaseUrl = process.env.CDN_BASE_URL || 'https://cdn.example.com';
    return {
      url: `${cdnBaseUrl}/products/${id}.jpg`,
      thumbnail: `${cdnBaseUrl}/products/${id}_thumb.jpg`,
    };
  }

  @Get(':id/images')
  @Header('Cache-Control', 'public, max-age=31536000') // 1 year cache
  @ApiOperation({ summary: 'Get all product images (CDN)' })
  @ApiResponse({ status: 200, description: 'Product images URLs' })
  async getProductImages(@Param('id') id: string) {
    const cdnBaseUrl = process.env.CDN_BASE_URL || 'https://cdn.example.com';
    return {
      images: [
        { url: `${cdnBaseUrl}/products/${id}_1.jpg`, type: 'main' },
        { url: `${cdnBaseUrl}/products/${id}_2.jpg`, type: 'gallery' },
        { url: `${cdnBaseUrl}/products/${id}_3.jpg`, type: 'gallery' },
      ],
    };
  }
}

