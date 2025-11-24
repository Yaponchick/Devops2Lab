module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/setupTests.js'],
  moduleNameMapper: {
    // ✅ исправлено: moduleNameMapper (не moduleNameMapping!)
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest'
  }
};