// MongoDB sharding script for Product Service
//
// NOTE:
// - Script này dùng cho cluster MongoDB sharded (không áp dụng trực tiếp cho single-node trong docker-compose hiện tại).
// - Chạy trong mongo shell kết nối tới mongos.

// 1. Enable sharding cho database product_db
sh.enableSharding('product_db');

// 2. Shard collection products theo sellerId
//    Điều này giúp phân tán dữ liệu theo seller, scale tốt hơn cho marketplace multi-seller.
sh.shardCollection('product_db.products', { sellerId: 1 });

// 3. (Tuỳ chọn) Pre-split shard key ranges nếu biết phân bố seller
// sh.splitAt('product_db.products', { sellerId: 'seller_1000' });
// sh.splitAt('product_db.products', { sellerId: 'seller_2000' });

print('Sharding configuration for product_db.products applied.');
