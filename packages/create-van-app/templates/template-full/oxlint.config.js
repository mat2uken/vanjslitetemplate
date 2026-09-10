import config from '@nkzw/oxlint-config';

export default {
  ...config,
  rules: {
    ...config.rules,
    // Turn off overly pedantic object key sorting for pragmatic UI/DOM development
    'perfectionist/sort-objects': 'off',
    'perfectionist/sort-object-types': 'off',
    // Allow console in benchmark/CLI scripts
    'no-console': 'off',
    'unicorn/prefer-node-protocol': 'off',
    'unicorn/numeric-separators-style': 'off',
  },
};
