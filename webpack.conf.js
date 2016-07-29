const webpack = require('webpack');

module.exports = {
  devtool: 'eval-cheap-module-source-map',
  bail: false,
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel',
        include: /(assets\/js|node_modules\/@bigcommerce\/stencil-utils)/,
        query: {
          compact: false,
          cacheDirectory: true,
          presets: ['es2015']
        }
      }
    ]
  },
  plugins: [
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery'
    })
  ],
  watch: false
};