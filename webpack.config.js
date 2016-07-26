var webpack = require('webpack');
var path = require('path');

module.exports = {
	entry: './www/source/js/index.js',
	output: {
		filename: 'bundle.js',
	},
	devtool: 'source-map',
	resolve: {
		root: path.resolve('./www/source/js'),
	},
	module: {
		loaders: [
			{
				test: /\.js?$/,
				exclude: /(node_modules)/,
				loader: 'babel',
			},
		],
	},
	plugins: [
		new webpack.optimize.OccurrenceOrderPlugin(),
		new webpack.optimize.DedupePlugin(),
		new webpack.optimize.UglifyJsPlugin({
			compressor: {
				screw_ie8: true,
			},
		}),
	],
};
