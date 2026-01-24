const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Watch folders for monorepo packages (required for symlinks/pnpm)
config.watchFolders = [
  path.resolve(monorepoRoot, "platform/shared"),
  path.resolve(monorepoRoot, "platform/host-app/data"),
  path.resolve(monorepoRoot, "config"), // Root config directory
  path.resolve(monorepoRoot, "node_modules"), // Root node_modules for hoisted deps
];

// Node modules resolution for pnpm symlinks
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

// Extra module aliases for workspace packages
config.resolver.extraNodeModules = {
  "@neo/shared": path.resolve(monorepoRoot, "platform/shared"),
};

// Disable hierarchical lookup to avoid duplicates with pnpm
config.resolver.disableHierarchicalLookup = false;

// Enable symlinks (critical for pnpm workspaces)
config.resolver.unstable_enableSymlinks = true;

module.exports = config;
