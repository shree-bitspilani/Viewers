// ~~ FIX WEBPACK HASH ISSUE
const hashFix = require('../../../.webpack/fix-webpack-hash');
// Monkey patch Node.js process to use xxhash64 instead of wasm hash
process.variants = { ...(process.variants || {}), ...{ webkit: false } };

const path = require('path');
const webpack = require('webpack');
// const analyticsPath = path.resolve(__dirname, '../../../platform/ui/src/utils/analytics/analytics.ts');

const ENTRY_VR = path.join(__dirname, '../src/index.ts');

module.exports = (env, argv) => {
  // Create the base config
  const config = {
    stats: {
      colors: true,
      hash: true,
      timings: true,
      assets: true,
      chunks: false,
      chunkModules: false,
      modules: false,
      children: false,
      warnings: true,
    },
    entry: {
      '@ohif/extension-cornerstone-nifti': ENTRY_VR,
    },
    output: {
      library: '@ohif/extension-cornerstone-nifti',
      libraryTarget: 'umd',
      libraryExport: 'default',
      path: path.resolve(__dirname, '../dist'),
      umdNamedDefine: false,
      globalObject: 'this',
      hashFunction: 'xxhash64',
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx|ts|tsx)?$/,
          exclude: /(node_modules)/,
          use: ['babel-loader'],
        },
      ],
    },
    resolve: {
      modules: [
        path.resolve(__dirname, '../node_modules'),
        path.resolve(__dirname, '../../../node_modules'),
        path.resolve(__dirname, '../src'),
      ],
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
      alias: {
        '@ohif/extension-cornerstone-nifti': path.resolve(__dirname, '../src/index.ts'),
      },
    },
    externals: [
      {
        'cornerstone-core': {
          commonjs: 'cornerstone-core',
          commonjs2: 'cornerstone-core',
          amd: 'cornerstone-core',
          root: 'cornerstone',
        },
        '@cornerstonejs/core': {
          commonjs: '@cornerstonejs/core',
          commonjs2: '@cornerstonejs/core',
          amd: '@cornerstonejs/core',
          root: 'cornerstone',
        },
        '@cornerstonejs/nifti-volume-loader': {
          commonjs: '@cornerstonejs/nifti-volume-loader',
          commonjs2: '@cornerstonejs/nifti-volume-loader',
          amd: '@cornerstonejs/nifti-volume-loader',
          root: '@cornerstonejs/nifti-volume-loader',
        },
        '@cornerstonejs/tools': {
          commonjs: '@cornerstonejs/tools',
          commonjs2: '@cornerstonejs/tools',
          amd: '@cornerstonejs/tools',
          root: 'cornerstoneTools',
        },
        '@ohif/core': {
          commonjs: '@ohif/core',
          commonjs2: '@ohif/core',
          amd: '@ohif/core',
          root: '@ohif/core',
        },
        '@ohif/ui': {
          commonjs: '@ohif/ui',
          commonjs2: '@ohif/ui',
          amd: '@ohif/ui',
          root: '@ohif/ui',
        },
        'react-router': {
          commonjs: 'react-router',
          commonjs2: 'react-router',
          amd: 'react-router',
          root: 'ReactRouter',
        },
        'react-router-dom': {
          commonjs: 'react-router-dom',
          commonjs2: 'react-router-dom',
          amd: 'react-router-dom',
          root: 'ReactRouterDOM',
        },
        react: {
          commonjs: 'react',
          commonjs2: 'react',
          amd: 'react',
          root: 'React',
        },
        'react-dom': {
          commonjs: 'react-dom',
          commonjs2: 'react-dom',
          amd: 'react-dom',
          root: 'ReactDOM',
        },
      },
    },
  };

  return config;
};
