import antfu from '@antfu/eslint-config';

export default antfu({
  formatters: true,
  react: true,
  stylistic: {
    semi: true,
    arrowParens: true,
  },
  rules: {
    'pnpm/yaml-enforce-settings': 'off',
    'ts/no-redeclare': 'off',
    'no-console': 'off',
    'ts/no-unsafe-function-type': 'warn',
    'ts/no-empty-object-type': 'warn',
    'ts/no-this-alias': 'warn',
    'unused-imports/no-unused-imports': 'error',
    'ts/no-namespace': 'warn',
    'no-prototype-builtins': 'warn',
  },
}, {
  files: ['**/test/**/*.ts', '**/test/**/*.tsx'],
  rules: {
    'no-self-compare': 'off',
    'unused-imports/no-unused-vars': 'off',
    'unicorn/error-message': 'off',
  },
});
