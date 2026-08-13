const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const { sourceExts, assetExts } = config.resolver;

config.resolver.sourceExts = [...sourceExts, 'mjs'];

module.exports = config;
