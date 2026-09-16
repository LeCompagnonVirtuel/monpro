const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [...(config.watchFolders || []), monorepoRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(monorepoRoot, 'node_modules'),
  path.resolve(projectRoot, 'node_modules'),
];

const singletonPkgs = ['react', 'react-native'];

config.resolver.extraNodeModules = Object.fromEntries(
  singletonPkgs.map((pkg) => [pkg, path.resolve(monorepoRoot, 'node_modules', pkg)]),
);

const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const pkgName = moduleName.startsWith('@')
    ? moduleName.split('/').slice(0, 2).join('/')
    : moduleName.split('/')[0];

  if (singletonPkgs.includes(pkgName)) {
    try {
      return {
        type: 'sourceFile',
        filePath: require.resolve(moduleName, { paths: [monorepoRoot] }),
      };
    } catch {}
  }

  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
