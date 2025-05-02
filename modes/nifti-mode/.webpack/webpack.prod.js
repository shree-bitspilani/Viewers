const { merge } = require('webpack-merge');
const path = require('path');
const webpack = require('webpack');
const webpackCommon = require('./webpack.common.js');
const TerserJSPlugin = require('terser-webpack-plugin');

const SRC_DIR = path.join(__dirname, '../src');
const DIST_DIR = path.join(__dirname, '../dist');

module.exports = (env, argv) => {
  const commonConfig = webpackCommon(env, argv);

  return merge(commonConfig, {
    mode: 'production',
    stats: {
      colors: true,
      hash: true,
      timings: true,
      assets: true,
      chunks: false,
      chunkModules: false,
      modules: false,
      children: false,
    },
    optimization: {
      minimize: true,
      minimizer: [
        new TerserJSPlugin({
          parallel: true,
        }),
      ],
    },
    output: {
      path: DIST_DIR,
      library: 'ohif-mode-nifti',
      libraryTarget: 'umd',
      filename: '[name].umd.js',
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify('production'),
      }),
    ],
  });
};
