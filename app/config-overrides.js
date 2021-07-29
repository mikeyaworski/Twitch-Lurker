module.exports = function override(config) {
  if (process.env.ACTUAL_ENV === 'development') {
    // Consolidate chunk files instead
    config.optimization.splitChunks = {
      cacheGroups: {
        default: false,
      },
    };
    // Slightly faster builds if we don't minimize. Debugging is also be easier in some cases.
    config.optimization.minimize = false;
  }
  return config;
};
