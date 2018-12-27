const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (options) => {
    return [
        new TerserPlugin({
            terserOptions: {
                ecma: 7,
                warnings: false,
                beautify: false,
                comments: false,
                parse: {},
                compress: {},
                mangle: true, // Note `mangle.properties` is `false` by default.
                module: false,
                output: null,
                toplevel: false,
                nameCache: null
            }
        })
    ]
}