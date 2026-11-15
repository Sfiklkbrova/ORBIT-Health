const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// WASM support for expo-sqlite
if (!config.resolver.assetExts.includes('wasm')) {
  config.resolver.assetExts.push('wasm');
}

// Required headers for SQLite Web
const previousMiddleware = config.server.enhanceMiddleware;

config.server.enhanceMiddleware = (middleware, server) => {
  const enhanced = previousMiddleware
    ? previousMiddleware(middleware, server)
    : middleware;

  return (req, res, next) => {
    res.setHeader(
      'Cross-Origin-Embedder-Policy',
      'credentialless'
    );
    res.setHeader(
      'Cross-Origin-Opener-Policy',
      'same-origin'
    );

    return enhanced(req, res, next);
  };
};

module.exports = config;