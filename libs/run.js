const path = require('path');
const fs = require('fs');
const shell = require("shelljs");
const webpack = require('webpack');
const commonConfig = require("../webpack/common");
const ora = require('ora');

module.exports = function(args){
    const gitshell = ora('检测git命令中').start();
    //判定git命令是否可用
    if (!shell.which('git')) {
        gitshell.fail('Sorry, this script requires git');
        shell.exit(1);
        return;
    }
    gitshell.succeed();

    const branchshell = ora('获取分支信息，如果分支为master，默认会按照production执行').start();
    const pwd = shell.pwd().stdout;
    const branch = shell.exec('git branch').stdout;
    let env = args['env'];
    if(!env){
        env = branch === 'master' ? 'production' : 'development';
    }
    branchshell.succeed(`当前分支${branch}`);


    const ROOT_PATH = path.resolve(pwd);
    const SRC_PATH = path.resolve(ROOT_PATH, "src");
    const INDEX_PATH = path.resolve(SRC_PATH);
    const BUILD_PATH = path.resolve(ROOT_PATH, "dist");

    var airduct = require(path.resolve(pwd, "airduct.config"));

    const zentAssets = path.resolve(SRC_PATH, 'public/gitImportDir/zentAssets/')


    const _options = {
        pwd,
        ROOT_PATH,
        SRC_PATH,
        INDEX_PATH,
        BUILD_PATH,
        zentAssets
    }
    const otherConfig = require('../webpack/' + env)(_options);
    _options.plugins = otherConfig.plugins;
    let config = commonConfig(env, airduct, _options)

    const webpackConfig = Object.assign(config, airduct.webpack.config || {});

    const webpackshell = ora('webpack执行').start();

    const compiler = webpack(webpackConfig);
    if(args['watch']){
        compiler.watch({
            aggregateTimeout: 300
        }, function(err, stats) {
            if(err){
                webpackshell.fail(err);
                return;
            }
            webpackshell.succeed(stats.toString({
                chunks: false,  // Makes the build much quieter
                colors: true    // Shows colors in the console
              }));
        });
    } else {
        webpackshell.succeed();
    }

}