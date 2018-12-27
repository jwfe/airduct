const webpack = require('webpack');
const CleanDistPlugin = require("./cleanDistPlugin");

module.exports = (options) => {
    return [
        new webpack.DefinePlugin({
            "process.env.NODE_ENV": `"development"`
        }),
        // 清理之前的编译目录
        new CleanDistPlugin({
            output: options.BUILD_PATH
        })
    ]
}