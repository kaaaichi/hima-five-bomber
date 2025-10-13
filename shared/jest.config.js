module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/types'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'types/**/*.ts',
    '!types/**/*.test.ts',
    '!types/**/*.d.ts',
  ],
};
