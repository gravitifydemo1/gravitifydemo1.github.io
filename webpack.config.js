const path = require('path');
const webpack = require('webpack');

const TerserPlugin = require('terser-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');


module.exports = {
  mode: "production",
  entry: "./src/index.js",
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
            presets: [`@babel/preset-env`],
            plugins: [
              "minify-dead-code-elimination"
            ]
          }
        }
      }
    ]
  },
  plugins: [
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

console.log(path.join(__dirname, '/node_modules'));
