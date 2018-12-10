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

    shell.echo('=============准备初始化中================');
    shell.exec('git clone ' + gitpath + ' ' + name);
    shell.cd(`./${name}`);
    var pwd = shell.pwd().stdout;

    shell.echo('=============配置读取完成================');

    // var waterway = require(path.resolve(pwd, "waterway.config"));
    // 如果没有yarn就使用npm
    if(!shell.which('yarn')){
        shell.exec('npm install');
    } else {
        shell.exec('yarn install');
    }

    shell.echo('=============准备创建nginx配置文件================');
    var configdir = path.resolve(pwd, 'config/');
    var str = fs.writeFileSync(path.resolve(configdir, 'yourname_nginx.conf') `
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

    shell.echo('=============创建nginx配置文件完成，准备启动================');

    shell.exec(`npm run dev`);

}