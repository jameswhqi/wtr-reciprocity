const path = require('path');

const ESLintPlugin = require('eslint-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = (env, argv) => {
  const config = {
    entry: {
      main: './src/client/index.ts'
    },
    output: {
      filename: 'bundle.[contenthash].js',
      path: path.join(process.cwd(), 'build'),
      clean: true
    },
    resolve: {
      extensions: ['.ts', '.js']
    },
    module: {
      rules: [
        {
          test: /\.ts/,
          exclude: /node_modules/,
          use: [
            'ts-loader'
          ]
        },
        {
          test: /\.(png|jpg|gif|svg)$/i,
          use: [
            'url-loader'
          ]
        }
      ]
    },
    plugins: [
      new ESLintPlugin({
        extensions: ['js', 'ts']
      }),
      new HtmlWebpackPlugin({
        template: 'src/client/index.ejs',
        favicon: 'public/favicon.png'
      })
    ]
  };

  if (argv.mode === 'production') {
    config.module.rules[0].use.unshift('babel-loader');
    config.plugins.push(
      new CopyPlugin({
        patterns: [
          { from: 'public', to: '' }
        ],
      })
    );
    config.performance = {
      maxEntrypointSize: 500000,
      maxAssetSize: 500000
    };
  } else {
    config.devtool = 'eval-cheap-module-source-map';
    config.devServer = {
      port: 8080,
      open: true
    };
  }

  return config;
}