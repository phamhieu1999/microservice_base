// Mock MongooseModule để tránh kết nối MongoDB trong test environment
jest.mock('@nestjs/mongoose', () => {
  const originalModule = jest.requireActual('@nestjs/mongoose');
  return {
    ...originalModule,
    MongooseModule: {
      ...originalModule.MongooseModule,
      forRoot: jest.fn().mockReturnValue({
        module: class MockMongooseModule {},
        providers: [],
        exports: [],
      }),
      forFeature: jest.fn().mockReturnValue({
        module: class MockMongooseFeatureModule {},
        providers: [],
        exports: [],
      }),
    },
  };
});

// Set NODE_ENV to test để tránh các connection không cần thiết
process.env.NODE_ENV = 'test';
process.env.NOTIFICATION_MONGO_URI = 'mongodb://localhost:27017/test_notification_db';










