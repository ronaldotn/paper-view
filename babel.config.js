export default {
  presets: [
    ['@babel/preset-env', {
      modules: 'auto',
      targets: {
        node: 'current'
      }
    }]
  ],
  plugins: ['@babel/plugin-transform-runtime']
};
