export default {
  clearMocks: true,
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  transformIgnorePatterns: [
    '\\\\node_modules\\\\',
  ],
  testPathIgnorePatterns: [
    '/build/',
  ],
};
