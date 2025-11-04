const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlInlineScriptPlugin = require('html-inline-script-webpack-plugin');

module.exports = {
    mode: 'production',
    // devtool: 'source-map',
    entry: {
        index: './src/index.js',
        // print: './src/print.js',
    },
    plugins: [
        new HtmlWebpackPlugin({
            title: 'OneKanban',
            template: './index.html',
            // minify: false, // Отключает минификацию HTML
        }),
        new HtmlInlineScriptPlugin(),
    ],
    output: {
        // filename: '[name].bundle.js',
        // path: path.resolve(__dirname, 'dist'),
        clean: true,
    },
    module: {
        rules: [
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            },
        ],
    },
    optimization: {
        minimize: false // Отключает минификацию JS
    },
};

