'use strict';

const { ModuleFederationPlugin } = require('webpack').container;
const deps = require('./package.json').dependencies;

const remoteEntry =
  process.env.REACT_APP_RESAURCE_REMOTE_ENTRY || 'http://127.0.0.1:3456/remote/remoteEntry.js';

module.exports = {
  jest: {
    configure(jestConfig) {
      jestConfig.moduleNameMapper = {
        ...(jestConfig.moduleNameMapper || {}),
        '^@inventory/cave-ui-lvm$': '<rootDir>/src/cave/__tests__/__mocks__/cave-ui-lvm.js',
      };
      jestConfig.testMatch = [
        ...(jestConfig.testMatch || []),
        '**/src/pacts/**/*.pact.js',
        '**/src/pacts/**/*.pact.test.js',
      ];
      return jestConfig;
    },
  },
  webpack: {
    configure(webpackConfig) {
      const path = require('path');
      webpackConfig.resolve = webpackConfig.resolve || {};
      webpackConfig.resolve.alias = {
        ...(webpackConfig.resolve.alias || {}),
        'log-view-machine/browser': path.resolve(
          __dirname,
          '../../log-view-machine/log-view-machine/dist/browser.esm.js'
        ),
      };
      webpackConfig.resolve.fallback = {
        ...(webpackConfig.resolve.fallback || {}),
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        http: false,
        https: false,
        zlib: false,
        path: false,
        os: false,
        util: false,
        url: false,
        querystring: false,
      };
      webpackConfig.output = webpackConfig.output || {};
      webpackConfig.output.publicPath = 'auto';
      const includePaths = [
        path.resolve(__dirname, '../packages/cave-ui-lvm/src'),
      ];
      const oneOfRule = webpackConfig.module.rules.find((r) => r.oneOf);
      if (oneOfRule) {
        oneOfRule.oneOf.forEach((rule) => {
          if (rule.loader && String(rule.loader).includes('babel-loader') && rule.include) {
            rule.include = Array.isArray(rule.include) ? [...rule.include, ...includePaths] : [rule.include, ...includePaths];
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
            react: {
              singleton: true,
              requiredVersion: deps.react,
              strictVersion: false,
            },
            'react-dom': {
              singleton: true,
              requiredVersion: deps['react-dom'],
              strictVersion: false,
            },
          },
        })
      );
      return webpackConfig;
    },
  },
};
