const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

let config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push("svg");

config.resolver.extraNodeModules = {
  "@noble/hashes": path.resolve(__dirname, "node_modules/@noble/hashes"),
  crypto: path.resolve(__dirname, "node_modules/@noble/hashes/crypto"),
};

const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "@noble/hashes/crypto.js" || moduleName === "@noble/hashes/crypto") {
    return {
      filePath: path.resolve(__dirname, "node_modules/@noble/hashes/crypto.js"),
      type: "sourceFile",
    };
  }
  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve("@lingui/metro-transformer/expo"),
};

module.exports = withNativeWind(config, { input: "./global.css" });
