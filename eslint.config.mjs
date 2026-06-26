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
    'prefer-arrow-callback': 'off',
    'test/prefer-lowercase-title': 'off',
  },
}, {
  // @power-di/data 的核心响应式引擎保留其上游紧凑的 JS 风格
  // （arguments 转发装饰器参数、松散相等、NaN 自比较等），
  // 仅在该包内放宽相应风格规则，避免为过 lint 而改写引擎代码、引入行为差异。
  files: ['packages/data/src/**/*.ts'],
  rules: {
    'prefer-rest-params': 'off',
    'eqeqeq': 'off',
    'no-self-compare': 'off',
    'unused-imports/no-unused-vars': 'off',
    'eslint-comments/no-unlimited-disable': 'off',
  },
});
