import 'reflect-metadata';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { User } from '../database/entities/user.entity';

/**
 * Seed admin/user accounts for dev/demo environments.
 *
 * This file is placed under src/ so it is compiled into dist/ and can be run
 * inside Docker images that only contain dist/ + production deps.
 */
const seedDataSource = new DataSource({
  type: 'postgres',
  host: process.env.AUTH_DB_HOST || 'localhost',
  // Ngoài Docker: postgres-auth được map 5433:5432 nên default là 5433
  // Trong Docker: AUTH_DB_PORT=5432 từ docker-compose sẽ override.
  port: +(process.env.AUTH_DB_PORT || 5433),
  username: process.env.AUTH_DB_USER || 'auth_user',
  password: process.env.AUTH_DB_PASSWORD || 'auth_password',
  database: process.env.AUTH_DB_NAME || 'auth_db',
  entities: [User],
  synchronize: true, // dev/demo only
  logging: false,
});

async function seed() {
  await seedDataSource.initialize();

  const userRepo = seedDataSource.getRepository(User);

  const seedUsers: Array<{ email: string; role: 'ADMIN' | 'USER'; password: string }> = [
    {
      email: 'admin@example.com',
      role: 'ADMIN',
      password: 'Admin@123',
    },
    {
      email: 'user@example.com',
      role: 'USER',
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
    console.log(`Đã tạo user ${u.email} với role=${u.role}, password=${u.password}`);
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


