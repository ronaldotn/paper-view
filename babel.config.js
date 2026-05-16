export default {
  presets: [
    ['@babel/preset-env', {
      modules: 'auto',
      targets: {
        node: 'current'
      }
    }],
    '@babel/preset-typescript'
  ],
  plugins: ['@babel/plugin-transform-runtime']
};
