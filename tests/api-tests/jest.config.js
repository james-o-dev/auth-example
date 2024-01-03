module.exports = {
  testEnvironment: 'node',
  setupFiles: ['dotenv/config'], // Load dotenv for environment variables
  globalTeardown: './lib/teardownJest.js',
}