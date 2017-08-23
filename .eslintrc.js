module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es6: true,
    node: true,
    jest: true,
    phantomjs: true,
  },
  extends: ['airbnb-base', 'plugin:flowtype/recommended'],
  parser: 'babel-eslint',
  plugins: ['import', 'flowtype'],
};
