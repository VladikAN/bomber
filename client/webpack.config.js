const path = require('path');
module.exports = {
  entry: './src/app.ts',
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: [ '.ts', '.tsx', '.js' ]
  },
  output: {
    filename: 'app.js',
    path: path.resolve(__dirname, 'wwwroot/js')
  },
  mode: 'development'
};