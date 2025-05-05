// Fix for the webpack wasm hash error
// This script modifies Node.js process to use xxhash64 instead of wasm hash
// Usage: add this to the beginning of your webpack config file

const path = require('path');
const webpack = require('webpack');

// Monkey patch Node.js process to use xxhash64 instead of wasm hash
// This is to fix the "TypeError: Cannot read properties of undefined (reading 'length')" error
process.variants = { ...(process.variants || {}), ...{ webkit: false } };

module.exports = {
  // Helper function to modify a webpack configuration
  applyHashFix: config => {
    if (!config) return config;

    // Set the output hash function to xxhash64 instead of the default wasm hash
    if (!config.output) config.output = {};
    config.output.hashFunction = 'xxhash64';

    return config;
  },
};
