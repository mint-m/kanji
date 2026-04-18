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
};
