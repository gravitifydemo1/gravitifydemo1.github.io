const path = require('path');
const webpack = require('webpack');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');


module.exports = {
  mode: "production",
  entry: "./src/index.js",
  externals: {
    'pixi.js': 'PIXI',
    'canvas.js': 'CanvasJS',
    'lodash': '_'
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "main.js"
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: [path.join(__dirname, '/node_modules/')],
        use: {
          loader: 'babel-loader',
          options: {
            presets: [`@babel/preset-env`]
          }
        }
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin(),
    new webpack.ProgressPlugin()
  ],
  optimization: {
    minimizer: [
      new TerserPlugin({
        cache: true,
        parallel: true,
        terserOptions: {
          mangle: true
        }
      })
    ]
  }
}
