import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';

export default [
  {
    ignores: ['dist/**/*', 'QuickResolve/**/*'],
  },
  firebaseRulesPlugin.configs['flat/recommended'],
];
