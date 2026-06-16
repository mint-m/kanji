const { VanillaExtractPlugin } = require('@vanilla-extract/webpack-plugin');

module.exports = {
  webpack: {
    plugins: {
      add: [new VanillaExtractPlugin()],
    },
    configure: (webpackConfig) => {
      // CRA's ModuleScopePlugin blocks Vanilla Extract's internal imports from node_modules.
      webpackConfig.resolve.plugins = webpackConfig.resolve.plugins.filter(
        (plugin) => plugin.constructor.name !== 'ModuleScopePlugin'
      );
      return webpackConfig;
    },
  },
  jest: {
    configure: (jestConfig) => {
      jestConfig.transform = {
        '\\.css\\.ts$': '@vanilla-extract/jest-transform',
        ...jestConfig.transform,
      };
      jestConfig.moduleNameMapper = {
        // axios@1.x: use CJS build so Jest (CommonJS) can resolve it
        '^axios$': '<rootDir>/node_modules/axios/dist/node/axios.cjs',
        ...jestConfig.moduleNameMapper,
      };
      return jestConfig;
    },
  },
};
