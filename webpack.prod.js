var config = require('./webpack.config')
var merge = require('webpack-merge')
var MiniCssExtractPlugin = require('mini-css-extract-plugin')
var OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin')
var UglifyJsPlugin = require('uglifyjs-webpack-plugin')

module.exports = merge(config, {
  mode: 'production',
  plugins: [
    new MiniCssExtractPlugin()
  ],
  module: {
    rules: [
        {
          test: /\.s?css$/,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader?importLoaders=1',
            'sass-loader'
          ]
        },
    ]
  },
  optimization: {
    minimizer: [
      new OptimizeCssAssetsPlugin(),
      new UglifyJsPlugin({
        cache: true,
        parallel: true,
        sourceMap: true
      })
    ]
  }
});
