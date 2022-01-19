const ClosurePlugin = require('closure-webpack-plugin');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const HtmlReplaceWebpackPlugin = require('html-replace-webpack-plugin');
const CopyPlugin = require("copy-webpack-plugin");
const crypto = require("crypto");
const buildHash = crypto.createHash("sha256").update(Date.now().toString()).digest("hex");
module.exports = {
  entry: './clientSrc/app.js',
  output: {
    filename: `openarras.${buildHash}.js`,
    path: path.resolve(__dirname, 'dist'),
  },
  optimization: {
    minimizer: [
        new ClosurePlugin({mode: 'STANDARD'}, {
          // compiler flags here
          //
          // for debugging help, try these:
          //
          // formatting: 'PRETTY_PRINT'
          // debug: true,
          renaming: true
        })
      ]
  },
  plugins: [new webpack.DefinePlugin({
    arrasBuild: JSON.stringify(buildHash)
 }),
    new HtmlWebpackPlugin({  // Also generate a test.html
    filename: 'index.html',
    template: './clientSrc/index.html'
  }), new HtmlReplaceWebpackPlugin([
    {
      pattern: 'openarras.js',
      replacement: `openarras.${buildHash}.js`
    }
  ]), new CopyPlugin({
    patterns: [
      { from: "./clientSrc/assets", to: "assets" },
      { from: "./clientSrc/favicons", to: "favicons" },
      { from: "./clientSrc/main.css", to: "./" },
      { from: "./clientSrc/changelogs.js", to: "./" },
      { from: "./clientSrc/features.js", to: "./" },
      { from: "./clientSrc/controls.js", to: "./" },

    ],
  })],
};