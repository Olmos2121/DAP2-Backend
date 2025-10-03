// jest.config.mjs
export default {
  testEnvironment: 'node',
  transform: {}, // sin Babel/TS
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1', // opcional, ayuda con imports con/sin .js
  },
};
