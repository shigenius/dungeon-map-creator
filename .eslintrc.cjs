module.exports = {
  root: true,
  env: { 
    browser: true, 
    es2020: true, 
    node: true
  },
  extends: [
    'eslint:recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'coverage', 'playwright-report'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    'no-unused-vars': ['warn', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_|^React$',
      ignoreRestSiblings: true 
    }],
    'no-undef': 'off', // TypeScriptがチェックするため無効化
    'no-case-declarations': 'off', // TypeScriptで適切に処理されるため
    'no-constant-condition': 'warn',
    'react-hooks/exhaustive-deps': 'warn',
  },
  globals: {
    NodeJS: 'readonly',
    global: 'readonly',
    process: 'readonly',
  },
}