const webpack = require('webpack');
const { merge } = require('webpack-merge');
const path = require('path');
const webpackCommon = require('./webpack.common.js');

const SRC_DIR = path.join(__dirname, '../src');
const DIST_DIR = path.join(__dirname, '../dist');

module.exports = (env, argv) => {
  const commonConfig = webpackCommon(env, argv);

  return merge(commonConfig, {
    mode: 'development',
    devtool: 'eval-cheap-module-source-map',
    devServer: {
      hot: true,
      open: true,
      port: 3000,
      historyApiFallback: {
        disableDotRule: true,
      },
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify('development'),
      }),
    ],
    output: {
      filename: '[name].js',
      library: 'ohif-mode-nifti',
      libraryTarget: 'umd',
      path: DIST_DIR,
    },
  });
};
