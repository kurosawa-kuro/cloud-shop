const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

/** @type {import('jest').Config} */
const customJestConfig = {
  testEnvironment: process.env.TEST_ENV === 'frontend' ? 'jsdom' : 'node',
  testMatch: [
    '<rootDir>/src/**/*.test.{tsx,jsx}',
    '<rootDir>/src/**/*.test.ts'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest'],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
  ],
  coverageDirectory: 'coverage',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // joseモジュールをトランスフォーム対象に含める
  transformIgnorePatterns: [
    '/node_modules/(?!(jose)/)'
  ]
}

module.exports = createJestConfig(customJestConfig) 