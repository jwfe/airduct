var path = require('path');
var fs = require('fs');
var shell = require("shelljs");
var glob = require("glob");

module.exports = function(){
    //判定git命令是否可用
    if (!shell.which('git')) {
        shell.echo('Sorry, this script requires git');
        shell.exit(1);
        return;
    }
    
    shell.echo('=============准备更新配置文件================');
    var pwd = shell.pwd().stdout;
    var waterway = require(path.resolve(pwd, "waterway.config"));
    shell.cd(`../`);
    var tempDir = 'temp_'+ (+new Date());
    shell.exec('git clone ' + waterway.public.git + ' '+ tempDir);

    shell.echo('=============下载完成准备覆盖原配置================');

    var tempAbsDir = path.join(pwd, '../' + tempDir);
    var files = glob.sync(path.resolve(tempAbsDir, '*.{js,json}'));
    files.forEach((item) => {
        shell.cp(item, pwd);
    });

    shell.rm('-rf', tempAbsDir)
    shell.echo('=============配置更新完成，准备重启webpack================');

    var whoami = shell.exec('who am i').stdout;
    whoami = whoami.split(' ')[0];
    shell.exec('ps aux | grep "' + whoami + '" | grep "webpack" |grep -v grep | cut -c 9-15 | xargs kill -9');

    shell.echo('=============杀掉webpack完成，准备重启================');
    shell.exec(`npm run dev`);
}