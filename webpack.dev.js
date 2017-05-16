var config = require('./webpack.config')
var merge = require('webpack-merge')
var path = require('path')
var webpack = require('webpack')

module.exports = merge(config, {
  mode: 'development',
  entry: {
    webpack: [
      'react-hot-loader/patch',
      'webpack-dev-server/client?http://localhost:8080',
      'webpack/hot/only-dev-server'
    ]
  },
  devServer: {
    hot: true,
    contentBase: path.resolve(__dirname, 'assets'),
    publicPath: '/',
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization"
    }
  },
  output: {
    publicPath: 'http://localhost:8080/',
    filename: '[name].js'
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
  ],
  module: {
    rules: [
      {
        test: /\.s?css$/,
        use: [
          'style-loader',
          'css-loader?importLoaders=1',
          'sass-loader',
        ]
      },
    ]
  }
});
