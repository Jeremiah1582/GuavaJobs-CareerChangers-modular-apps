module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts', 'tsx'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)sx?$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
        },
      },
    ],
  },
  collectCoverageFrom: ['**/*.(t|j)s', '**/*.tsx'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  transformIgnorePatterns: [
    '/node_modules/(?!(@react-pdf/renderer|@react-pdf/layout|@react-pdf/primitives|@react-pdf/font|@react-pdf/pdfkit|@react-pdf/png-js|@react-pdf/render|@react-pdf/fns|@react-pdf/stylesheet|@react-pdf/textkit|@react-pdf/image|yoga-layout)/)',
  ],
};
