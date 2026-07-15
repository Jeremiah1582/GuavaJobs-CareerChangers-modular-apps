module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  testRegex: '\\.eval\\.spec\\.ts$',
  setupFiles: ['<rootDir>/setup-env.js'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  testTimeout: 180_000,
  maxWorkers: 1,
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/../../src/$1',
  },
};
