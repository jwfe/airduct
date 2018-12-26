const path = require('path');
const fs = require('fs');
const shell = require("shelljs");
const shell = require("shelljs");
const ora = require('ora');

module.exports = function(gitpath, name){
    const gitshell = ora('检测git命令中').start();
    //判定git命令是否可用
    if (!shell.which('git')) {
        gitshell.fail('对不起，必须依赖git');
        shell.exit(1);
        return;
    }

    const initshell = ora('开始初始化').start();
    var pwd = shell.pwd().stdout;
    var airduct = require(path.resolve(pwd, "airduct.config"));
    // 从git目录下拉取初始化的项目
    shell.cd(`../`);
    var tempDir = 'temp_'+ (+new Date());
    shell.exec('git clone ' + airduct.public.git + ' '+ tempDir);
    // 复制内容
    var tempAbsDir = path.join(pwd, '../' + tempDir );
    shell.cp('-rf', tempAbsDir + '/*', pwd);

    // 清理到无用的内容
    shell.rm('-rf', path.resolve(pwd, '.git/'));
    shell.rm('-rf', tempAbsDir);
    shell.cd(pwd);
    initshell.succeed();

    const installshell = ora('下载相应依赖').start();
    shell.exec('npm install');
    installshell.succeed();
    
    const nginxshell = ora('创建nginx配置文件').start();
    var configdir = path.resolve(pwd, 'config/yourname_nginx.conf');
    var str = fs.writeFileSync(configdir, `
        server {
            listen	   80;
            server_name  testa.test.cn;

            gzip on;
            gzip_min_length 1k;
            gzip_buffers 4 16k;
            gzip_comp_level 5;
            gzip_types text/plain application/x-javascript text/css application/xml text/javascript application/x-httpd-php;
        
            location ~ .*\.(gif|jpg|jpeg|png|bmp|ico|javascript|js|css|flv|media|woff|eot|ttf|html)$ {
                root ${pwd}/dist;
                expires 30d;
            }
        
        }
    `);

    nginxshell.succeed();

    const airductshell = ora('重启airduct编译').start();
    shell.exec(`airduct run --watch`);
    airductshell.succeed();
}