var path = require('path');
var fs = require('fs');
var shell = require("shelljs");
var glob = require("glob");
var webpack = require('webpack');
var HtmlwebpackPlugin = require("html-webpack-plugin");
var TerserPlugin = require('terser-webpack-plugin');
//css tree shaking
var PurifyCSSPlugin = require("purifycss-webpack");

class RouterPlugin{
    constructor(config = {}){
        this.path = config.basepath;
        this.output = config.output;
        this.filePath = config.filePath || '**/index.js';
        this.template = config.template || function(){return null};
    }

    getDirs(){
        const files = glob.sync(path.resolve(this.path, this.filePath));
        const routers = [];
        files.forEach((file)=>{
            const dir = path.dirname(file);
            if(dir.length <= this.path.length){
                return;
            }
            let route = dir.replace(this.path, '');
            route = route.replace(/\/(img|component).*/, '');
            routers.push(route);
        })
        return Array.from(new Set(routers));
    }
    getRouterList(){
        var pwd = shell.pwd().stdout;
        const ROUTER_JSON = require(path.resolve(pwd, 'src/router.json'));
        const pathItems = Object.keys(ROUTER_JSON);
        let arr = [];
        pathItems.forEach((item)=>{
            ROUTER_JSON[item].forEach((pathItems)=>{
                if(!pathItems.list){
                    arr.push({
                        directory: pathItems.directory,
                        path: pathItems.path || '',
                        authKey: pathItems.authKey || 2,
                        directoryOld: item,
                    });
                    return;
                }
                pathItems.list.forEach((dir)=>{
                    dir['directory'] = pathItems.directory;
                    dir['directoryOld'] = item;
                    arr.push(dir);
                })
            })
        })
        return arr;
    }
    getTemplate(){
        let template = `import Bundle from "Components/bundle";`;
        const arr = [];
        const pathDirs = this.path.split('/');
        //console.log(this.getRouterList());
        this.getRouterList().forEach((dir)=>{
            arr.push(`
                {
                    path: '${dir.directory}${dir.path}',
                    authKey: ${dir.authKey},
                    group: '${dir.directoryOld}',
                    exact: true,
                    component(props) {
                        return <Bundle {...props} load={() => import('./${pathDirs[pathDirs.length - 1]}/${dir.directoryOld}/${dir.path}')} />;
                    }
                }
            `)
        });

        return `${template} export default [${arr.join(',')}];`
    }

    apply(compiler) {
        compiler.plugin("entryOption",  (compilation, callback) => {
            const template = this.template(this.getDirs()) || this.getTemplate();
            fs.writeFileSync(this.output, template);
            // console.log(this.output);
            // compilation.assets[this.output].source = () => html;
            // callback();
        });
    }
}
/**
 * 通用组件更新
 */
class GitImportPlugin{
    constructor(options){
        this.opts = {
            gitStock: options.gitStock,
            output: options.output
        }
        var pwd = this.pwd = shell.pwd().stdout;
        var airduct = require(path.resolve(pwd, "airduct.config"));
        this.gitImports = airduct.webpack.imports;
        this.gitImportDir = path.resolve(this.opts.output, `gitImportDir`);
        shell.rm('-rf', this.gitImportDir);
    }
    download(){
        this.downloadDir = path.resolve(this.pwd, `../temp_import_${+ new Date()}`);
        shell.exec(`git clone ${this.opts.gitStock} ${this.downloadDir}`)
    }
    copy(){
        shell.mkdir('-p', this.gitImportDir);
        this.gitImports.forEach((item) => {
            shell.exec(`cd ${this.downloadDir} && cp -rf ${item}/ ${this.gitImportDir}/${item}`);
        });
    }
    remove(){
        shell.rm('-rf',this.downloadDir);
    }
    apply(compiler) {
        compiler.plugin("entryOption",  (compilation, callback) => {
            console.log('[GitImportPlugin依赖]', JSON.stringify(this.gitImports));
            if(this.opts.gitStock && this.gitImports){
                this.download();
                this.copy();
                this.remove()
            }
            // callback();
        });
    }
}

module.exports = function(args){
    //判定git命令是否可用
    if (!shell.which('git')) {
        shell.echo('Sorry, this script requires git');
        shell.exit(1);
        return;
    }

    var pwd = shell.pwd().stdout;
    var branch = shell.exec('git branch').stdout;
    var env = args['env'];
    if(!env){
        env = branch === 'master' ? 'production' : 'development';
    }

    const ROOT_PATH = path.resolve(pwd);
    const SRC_PATH = path.resolve(ROOT_PATH, "src");
    const INDEX_PATH = path.resolve(SRC_PATH);
    const BUILD_PATH = path.resolve(ROOT_PATH, "dist");

    var airduct = require(path.resolve(pwd, "airduct.config"));

    const zentAssets = path.resolve(SRC_PATH, 'public/gitImportDir/zentAssets/')

    let plugins = [
        new RouterPlugin({
            filePath: '**/index.js',
            basepath: path.resolve(SRC_PATH, 'pages'),
            output: path.resolve(SRC_PATH, 'routerConfig.js')
        }),
        new GitImportPlugin({
            gitStock: airduct.public.components,
            output: path.resolve(SRC_PATH, 'public')
        }),
        // css 
        new PurifyCSSPlugin({
            paths: glob.sync(path.join(SRC_PATH, '*/*/*.html'))
        }),
        new webpack.ProvidePlugin({
            "React": "react"
        }),
        new webpack.LoaderOptionsPlugin({
            options: {}
        }),
        new HtmlwebpackPlugin({
            title: airduct.webpack.title,
            filename: "index.html",
            template: path.resolve(SRC_PATH, "templates", "index.html"),
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
    
    // 不同环境对应不同的配置
    if (env === 'development') {
        plugins.unshift(new webpack.DefinePlugin({
            "process.env.NODE_ENV": `"${env}"`
        }))
    } else {
        plugins.push(
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
        )
    }

    var webpack_config = {
        watchOptions: {
            ignored: ['routerConfig', 'gitImportDir']
        },
        cache: env === 'development',
        mode: env,
        entry: {
            index: path.resolve(INDEX_PATH, "index.js")
        },
        output: {
            path: BUILD_PATH,
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
                    "config": path.resolve(ROOT_PATH, 'config'),
                    "Components": path.resolve(SRC_PATH, 'public/components/'),
                    "routerConfig": path.resolve(SRC_PATH, 'routerConfig.js'),
                    "Theme": path.resolve(zentAssets, 'theme/index.less'),
                    "zentAssets": zentAssets,
                    "Actions": path.resolve(SRC_PATH, 'redux/actions/'),
                    "routerJson": path.resolve(SRC_PATH, 'router.json'),
                    "gitImportDir": path.resolve(SRC_PATH, 'public/gitImportDir/'),
                    "Auth": path.resolve(SRC_PATH, 'public/gitImportDir/auth/'),
                    "Libs": path.resolve(SRC_PATH, 'public/gitImportDir/libs/'),
                },
                airduct.webpack.zentAlias(path.resolve(SRC_PATH, 'public/gitImportDir/zent/'))
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
                    exclude: zentAssets,
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
                    include: path.resolve(zentAssets, "common"),
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
                    include: path.resolve(zentAssets, "zent"),
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
                    include: SRC_PATH,
                },
                {
                    test: /\.(png|jpg|gif|svg)$/,
                    loader: 'file-loader',
                    include: SRC_PATH,
                    options: {
                        name: '[name].[ext]?[hash]'
                    }
                },
                {
                    test: /\.(woff|woff2|eot|ttf)\??.*$/,
                    include: SRC_PATH,
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
        // 配置plugin
        plugins: plugins
    };


    var config = Object.assign(webpack_config, airduct.webpack.config || {});

    console.log('%j', config.watchOptions)

    var compiler = webpack(config);
    if(args['watch']){
        compiler.watch({
            aggregateTimeout: 300
        }, function(err, stats) {
            if(err){
                return console.log(err);
            }
            console.log(stats.toString({
                chunks: false,  // Makes the build much quieter
                colors: true    // Shows colors in the console
              }));
        });
    }

}