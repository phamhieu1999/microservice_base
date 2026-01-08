module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: [
    '<rootDir>/test/**/*.spec.ts',
    '<rootDir>/test/**/*.e2e-spec.ts',
  ],
  moduleFileExtensions: ['js', 'json', 'ts'],
  moduleNameMapper: {
    '^(src/(.*))$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.dto.ts',
    '!src/**/*.entity.ts',
    '!src/**/*.interface.ts',
    '!src/main.ts',
  ],
  testTimeout: 30000, // 30 seconds timeout for e2e tests
};

