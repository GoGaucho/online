module.exports = {
  pwa: {
    name: 'Gaucho Online',
    themeColor: '#132A4F'
  },

  transpileDependencies: [
    'vuetify'
  ],

  publicPath: '',

  devServer: {
    proxy: {
      '/api': {
        target: 'https://gogaucho.app/',
        changeOrigin: true
      }
    }
  },

  outputDir: 'online',
  productionSourceMap: false
}
