import 'reflect-metadata';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { User } from '../src/database/entities/user.entity';

// DataSource riêng cho script seed, dùng synchronize để auto tạo bảng trong dev
const seedDataSource = new DataSource({
  type: 'postgres',
  host: process.env.AUTH_DB_HOST || 'localhost',
  port: +(process.env.AUTH_DB_PORT || 5432),
  username: process.env.AUTH_DB_USER || 'auth_user',
  password: process.env.AUTH_DB_PASSWORD || 'auth_password',
  database: process.env.AUTH_DB_NAME || 'auth_db',
  entities: [User],
  synchronize: true,
  logging: false,
});

async function seed() {
  await seedDataSource.initialize();

  const userRepo = seedDataSource.getRepository(User);

  const seedUsers = [
    {
      email: 'admin@example.com',
      role: 'ADMIN' as const,
      password: 'Admin@123',
    },
    {
      email: 'user@example.com',
      role: 'USER' as const,
      password: 'User@123',
    },
  ];

  for (const u of seedUsers) {
    const existing = await userRepo.findOne({ where: { email: u.email } });
    if (existing) {
      // eslint-disable-next-line no-console
      console.log(`User ${u.email} đã tồn tại, bỏ qua`);
      continue;
    }

    const passwordHash = await bcrypt.hash(u.password, 10);
    const user = userRepo.create({
      email: u.email,
      passwordHash,
      role: u.role,
      emailVerified: true,
    });
    await userRepo.save(user);

    // eslint-disable-next-line no-console
    console.log(
      `Đã tạo user ${u.email} với role=${u.role}, password=${u.password}`,
    );
  }

  await seedDataSource.destroy();
}

seed()
  .then(() => {
    // eslint-disable-next-line no-console
    console.log('Seed auth-service hoàn tất');
    process.exit(0);
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Lỗi seed auth-service', err);
    process.exit(1);
  });


