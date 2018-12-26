var path = require('path');
var fs = require('fs');
var shell = require("shelljs");
var glob = require("glob");
const ora = require('ora');

module.exports = function(){
    const gitshell = ora('检测git命令中').start();
    //判定git命令是否可用
    if (!shell.which('git')) {
        gitshell.fail('Sorry, this script requires git');
        shell.exit(1);
        return;
    }
    gitshell.succeed();
    
    const configshell = ora('更新配置文件').start();
    var pwd = shell.pwd().stdout;
    var airduct = require(path.resolve(pwd, "airduct.config"));
    shell.cd(`../`);
    var tempDir = 'temp_'+ (+new Date());
    shell.exec('git clone ' + airduct.public.git + ' '+ tempDir);
    shell.cd(pwd);
    configshell.succeed();

    const cpConfshell = ora('覆盖原配置').start();
    var tempAbsDir = path.join(pwd, '../' + tempDir);
    var files = glob.sync(path.resolve(tempAbsDir, '*.{js,json}'));
    files.forEach((item) => {
        var filename = path.parse(item).name;
        // 忽略的文件不处理
        if(airduct.ignore && airduct.ignore[filename]){
            return;
        }
        shell.cp(item, pwd);
    });
    shell.rm('-rf', tempAbsDir);
    cpConfshell.succeed();

    const killshell = ora('杀掉airduct进程').start();
    var whoami = shell.exec('who am i').stdout;
    whoami = whoami.split(' ')[0];
    shell.exec('ps aux | grep "' + whoami + '" | grep "airduct" |grep -v grep | cut -c 9-15 | xargs kill -9');
    killshell.succeed();

    const packageshell = ora('package.json更新').start();
    shell.exec(`npm install`);
    packageshell.succeed();

    const airductshell = ora('重启airduct');
    shell.exec(`airduct run --watch`);
    airductshell.succeed();
}