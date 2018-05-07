const webpack = require('webpack');
const path = require('path');

/*
 * We've enabled UglifyJSPlugin for you! This minifies your app
 * in order to load faster and run less javascript.
 *
 * https://github.com/webpack-contrib/uglifyjs-webpack-plugin
 *
 */

const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
	entry: ['babel-polyfill', './src/index'],
  mode: 'development',

	output: {
		filename: 'looper.bundle.js',
		path: path.resolve(__dirname, 'build')
	},

	module: {
		rules: [
			{
				test: /\.(js|jsx)$/,
				exclude: /node_modules/,
				loader: 'babel-loader',
        options: { presets: ['env'] }
			}
		]
	},
  resolve: { extensions: ['*', '.js', '.jsx'] },

	//plugins: [new UglifyJSPlugin()]
};
