const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable the New Architecture Interop Layer
config.resolver.unstable_enablePackageExports = true;

// Polyfill Node.js modules for react-native-quick-crypto
config.resolver.extraNodeModules = {
  crypto: require.resolve('react-native-quick-crypto'),
  buffer: require.resolve('buffer'),
  stream: require.resolve('stream-browserify'),
};

module.exports = config;