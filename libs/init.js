var path = require('path');
var fs = require('fs');
var shell = require("shelljs");

module.exports = function(gitpath, name){
    //判定git命令是否可用
    if (!shell.which('git')) {
        shell.echo('Sorry, this script requires git');
        shell.exit(1);
        return;
    }

    shell.echo('[1/4]准备初始化中');
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

    shell.echo('[2/4]准备下载相应依赖');
    shell.exec('npm install');
    
    shell.echo('[3/4]准备创建nginx配置文件');
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

    shell.echo('[1/4]创建nginx配置文件完成，准备启动');

    shell.exec(`airduct run --watch`);

}