//require our dependencies
var path = require('path')
var webpack = require('webpack')
var BundleTracker = require('webpack-bundle-tracker')
var LodashModuleReplacementPlugin = require('lodash-webpack-plugin')
var HtmlWebpackPlugin = require('html-webpack-plugin')
var HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin')
var WorkboxPlugin = require('workbox-webpack-plugin')
var WriteFilePlugin = require('write-file-webpack-plugin')

module.exports = {
    //the base directory (absolute path) for resolving the entry option
    context: __dirname,
    //the entry point we created earlier. Note that './' means 
    //your current directory. You don't have to specify the extension  now,
    //because you will specify extensions later in the `resolve` section
    entry: {
      main: [
        './assets/js/index',
      ], 
    },

    devtool: 'cheap-module-eval-source-map',
    
    output: {
        //where you want your compiled bundle to be stored
        path: path.resolve('./assets/bundles/'), 
        //naming convention webpack should use for your files
        filename: '[name]-[hash].js', 
        publicPath: '/static/bundles/'
    },

    optimization: {
      namedModules: true,
      splitChunks: {
        chunks: "all",
        cacheGroups: {
          fontAwesome: {
            test: /[\\/]node_modules[\\/]@fortawesome/
          },
          components: {
            test: /[\\/]assets[\\/]js[\\/]components/
          },
          redux: {
            test: /[\\/]assets[\\/]js[\\/](reducers|selectors|actions)/
          }
        },
      },
      runtimeChunk: {
        name: "manifest"
      },
    },
    
    plugins: [
        //tells webpack where to store data about your bundles.
        new BundleTracker({filename: './webpack-stats.json'}), 
        new LodashModuleReplacementPlugin(),
        new HtmlWebpackPlugin({
          title: 'EBFE Organizer',
          template: 'assets/index.html',
          filename: 'webpack-index.html',
          alwaysWriteToDisk: true
        }),
        new HtmlWebpackHarddiskPlugin(),
        new WriteFilePlugin({
          test: /service-worker\.js/
        }),
        new WorkboxPlugin.GenerateSW({
          clientsClaim: true,
          skipWaiting: true,
          runtimeCaching: [
            {
              urlPattern: new RegExp('https://fonts.(?:googleapis|gstatic).com/(.*)'),
              handler: 'staleWhileRevalidate'
            },
            {
              urlPattern: new RegExp('https://cdn.ravenjs.com/(.*)'),
              handler: 'networkFirst'
            },
            {
              urlPattern: new RegExp(/\/api\//),
              handler: 'networkFirst'
            },
          ]
        })
    ],
    
    module: {
        rules: [
            //a regexp that tells webpack use the following loaders on all 
            //.js and .jsx files
            {test: /\.jsx?$/, 
                //we definitely don't want babel to transpile all the files in 
                //node_modules. That would take a long time.
                exclude: /node_modules\/(?!(gravatar-url|md5-hex)\/).*/,
                //use the babel loader 
                use: [
                  'babel-loader',
                  'eslint-loader'
                ]
            },
            {test: /\.(png|jpe?g|gif)$/,
              use: [
                'file-loader?name=[path][name].[ext]',
                'image-webpack-loader',
              ]
            },
            {
              test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
              use: "file-loader?name=[path][name].[ext]"
            },
            {
              test: /\.(ttf|eot)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
              use: "file-loader?name=[path][name].[ext]"
            }
        ]
    },
    
    resolve: {
        //tells webpack where to look for modules
        //modulesDirectories: ['node_modules'],
        //extensions that should be used to resolve modules
        extensions: ['.js', '.jsx'] 
    }
}


