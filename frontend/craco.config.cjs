'use strict';

const path = require('path');
const { ModuleFederationPlugin } = require('webpack').container;

const remoteEntry =
  process.env.REACT_APP_RESAURCE_REMOTE_ENTRY || 'http://127.0.0.1:3456/remote/remoteEntry.js';

module.exports = {
  webpack: {
    configure(webpackConfig) {
      const oneOf = webpackConfig.module.rules.find((r) => r.oneOf);
      if (oneOf && Array.isArray(oneOf.oneOf)) {
        const lvm = path.resolve(__dirname, 'node_modules/log-view-machine');
        oneOf.oneOf.forEach((rule) => {
          if (rule.include && !Array.isArray(rule.include)) {
            rule.include = [rule.include, lvm];
          } else if (rule.include && Array.isArray(rule.include)) {
            rule.include.push(lvm);
          }
        });
      }
      webpackConfig.plugins.push(
        new ModuleFederationPlugin({
          name: 'inventory_host',
          remotes: {
            resaurce_hr: `resaurce_hr@${remoteEntry}`,
          },
          shared: {
            react: { singleton: true, requiredVersion: '^18.2.0' },
            'react-dom': { singleton: true, requiredVersion: '^18.2.0' },
          },
        })
      );
      return webpackConfig;
    },
  },
};
