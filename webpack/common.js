const webpack = require('webpack');
const path = require('path');
const glob = require("glob");
const HtmlwebpackPlugin = require("html-webpack-plugin");
const PurifyCSSPlugin = require("purifycss-webpack");
const RouterPlugin = require("./routerPlugin");
const GitImportPlugin = require("./gitImportPlugin");

module.exports = (env, airduct, options = {}) => {
    let plugins = [
        new RouterPlugin({
            filePath: '**/index.js',
            basepath: path.resolve(options.SRC_PATH, 'pages'),
            output: path.resolve(options.SRC_PATH, 'routerConfig.js')
        }),
        new GitImportPlugin({
            gitStock: airduct.public.components,
            output: path.resolve(options.SRC_PATH, 'public')
        }),
        // css 
        new PurifyCSSPlugin({
            paths: glob.sync(path.join(options.SRC_PATH, '*/*/*.html'))
        }),
        new webpack.ProvidePlugin({
            "React": "react"
        }),
        new webpack.LoaderOptionsPlugin({
            options: {}
        }),
        new HtmlwebpackPlugin({
            env: env,
            title: airduct.webpack.title,
            filename: "index.html",
            template: path.resolve(options.SRC_PATH, "templates", "index.html"),
            minify: {
                removeComments: true,
                collapseWhitespace: true,
                removeRedundantAttributes: true,
                removeScriptTypeAttributes: true,
                removeStyleLinkTypeAttributes: true,
                removeAttributeQuotes: true
            }
        }),
    ];
    
    plugins = plugins.concat(options.plugins || []);

    return {
        watchOptions: {
            ignored: ['routerConfig', 'gitImportDir']
        },
        cache: env === 'development',
        mode: env,
        entry: {
            index: path.resolve(options.INDEX_PATH, "index.js")
        },
        output: {
            path: options.BUILD_PATH,
            filename: "js/[name].[chunkhash:5].js"
        },
        // 开启dev source map
        devtool: env === 'production' ? false : "eval",
        // devtool: "cheap-module-eval-source-map",
        // devtool: "eval",
        // 开启 webpack dev server
        devServer: {
            historyApiFallback: true,
            hot: true,
            inline: true,
        },
        resolve: {
            
            alias: Object.assign(
                {
                    "config": path.resolve(options.ROOT_PATH, 'config'),
                    "Components": path.resolve(options.SRC_PATH, 'public/components/'),
                    "routerConfig": path.resolve(options.SRC_PATH, 'routerConfig.js'),
                    "Theme": path.resolve(options.zentAssets, 'theme/index.less'),
                    "zentAssets": options.zentAssets,
                    "Actions": path.resolve(options.SRC_PATH, 'redux/actions/'),
                    "routerJson": path.resolve(options.SRC_PATH, 'router.json'),
                    "gitImportDir": path.resolve(options.SRC_PATH, 'public/gitImportDir/'),
                    "Auth": path.resolve(options.SRC_PATH, 'public/gitImportDir/auth/'),
                    "Libs": path.resolve(options.SRC_PATH, 'public/gitImportDir/libs/'),
                },
                airduct.webpack.zentAlias(path.resolve(options.SRC_PATH, 'public/gitImportDir/zent/'))
              ),
            extensions: [".js", ".jsx", ".less"]
        },
        module: {
            rules: [
                // {
                //   test: /\.jsx?$/,
                //   use: [
                //     {
                //       loader: "eslint-loader"
                //     }
                //   ],
                //   include: SRC_PATH,
                //   enforce: "pre"
                // },
                {
                    test: /\.less$/,
                    exclude: options.zentAssets,
                    use: [{
                            loader: "style-loader"
                        },
                        {
                            loader: "css-loader",
                            options: {
                                sourceMap: true,
                                modules: true,
                                localIdentName: "[local]_[hash:base64:5]"
                            }
                        },
                        {
                            loader: "less-loader"
                        }
                    ]
                },
                {
                    test: /\.less$/,
                    include: path.resolve(options.zentAssets, "common"),
                    use: [{
                            loader: "style-loader"
                        },
                        {
                            loader: "css-loader"
                        },
                        {
                            loader: "less-loader"
                        }
                    ]
                },
                {
                    test: /\.pcss$/,
                    include: path.resolve(options.zentAssets, "zent"),
                    use: [
                        'style-loader',
                        { loader: 'css-loader' },
                        {
                            loader: 'postcss-loader',
                        }
                    ]
                },
                {
                    test: /\.jsx?$/,
                    use: [{
                        loader: "babel-loader"
                    }],
                    include: options.SRC_PATH,
                },
                {
                    test: /\.(png|jpg|gif|svg)$/,
                    loader: 'file-loader',
                    include: options.SRC_PATH,
                    options: {
                        name: '[name].[ext]?[hash]'
                    }
                },
                {
                    test: /\.(woff|woff2|eot|ttf)\??.*$/,
                    include: options.SRC_PATH,
                    use: {
                        loader: 'url-loader',
                        options: {
                            limit: 8192,
                            name: '[name].[ext]?[hash]'
                        }
                    }
                }
            ]
        },
        optimization: {
            //SplitChunksPlugin配置，其中缓存组概念目前不是很清楚
            runtimeChunk: true,
            splitChunks: {
                // 表示显示块的范围，有三个可选值：initial(初始块)、async(按需加载块)、all(全部块)，默认为all;
                chunks: "async",
                // 表示在压缩前的最小模块大小，默认为0；
                minSize: 3000,
                //表示被引用次数，默认为1
                minChunks: 1,
                //最大的按需(异步)加载次数，默认为1；
                maxAsyncRequests: 3,
                //最大的初始化加载次数，默认为1；
                maxInitialRequests: 3,
                // 拆分出来块的名字(Chunk Names)，默认由块名和hash值自动生成；设置ture则使用默认值
                name: true,
                //缓存组，目前在项目中设置cacheGroup可以抽取公共模块，不设置则不会抽取
                cacheGroups: {
                    //缓存组信息，名称可以自己定义
                    commons: {
                        //拆分出来块的名字,默认是缓存组名称+"~" + [name].js
                        // name: "test",
                        // 同上
                        chunks: "async",
                        // 同上
                        // minChunks: 3,
                        // 如果cacheGroup中没有设置minSize，则据此判断是否使用上层的minSize，true：则使用0，false：使用上层minSize
                        enforce: true,
                        //test: 缓存组的规则，表示符合条件的的放入当前缓存组，值可以是function、boolean、string、RegExp，默认为空；
                        test: ""
                    },
                    //设置多个缓存规则
                    vendor: {
                        test: /node_modules/,
                        chunks: "async",
                        name: "vendor",
                        //表示缓存的优先级
                        priority: 10,
                        enforce: true
                    }
                }
            }
        },
        plugins
    }
};