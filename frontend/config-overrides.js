// config-overrides.js
// Fixes CSP 'eval' error by disabling eval-based devtool and style injection
module.exports = function override(config, env) {
  // Use a devtool that does NOT use eval()
  config.devtool = env === 'development' ? 'cheap-module-source-map' : 'source-map';

  // Fix style-loader eval() usage — use styleTag injection instead
  const rules = config.module.rules.find(r => r.oneOf)?.oneOf || [];
  rules.forEach(rule => {
    if (!rule.use) return;
    const loaders = Array.isArray(rule.use) ? rule.use : [rule.use];
    loaders.forEach(loader => {
      const loaderPath = typeof loader === 'string' ? loader : loader?.loader;
      if (loaderPath && loaderPath.includes('style-loader')) {
        if (typeof loader === 'object') {
          loader.options = loader.options || {};
          loader.options.injectType = 'styleTag';
        }
      }
    });
  });

  // Eliminate eval from webpack output
  config.output = {
    ...config.output,
    globalObject: 'self',
  };

  return config;
};
