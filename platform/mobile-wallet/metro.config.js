const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Add shared package to watch folders
config.watchFolders = [path.resolve(__dirname, "../shared")];

// Configure resolver for @neo/shared alias
config.resolver.extraNodeModules = {
  "@neo/shared": path.resolve(__dirname, "../shared"),
};

module.exports = config;
