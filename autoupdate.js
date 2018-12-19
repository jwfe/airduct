var path = require('path');
var fs = require('fs');
var shell = require("shelljs");
var glob = require("glob");

const diranme = __dirname;

function updateRemote(temp_path){
    const client_package_path = path.resolve(temp_path, 'package.json');
    const remote_package = JSON.parse(fs.readFileSync(client_package_path))
    return remote_package;
}


module.exports = function(){
    const client_package_path = path.resolve(diranme, 'package.json');
    const client_package = JSON.parse(fs.readFileSync(client_package_path));
    const client_version = client_package.version;

    const temp_path = path.resolve(diranme, '../temp_airduct')
    shell.exec(`git clone ${remote_package_path} ${temp_path}`);
    const remote_package_path = 'https://github.com/Johnqing/airduct.git';
    const remote_package = updateRemote(temp_path);
    const remote_version = remote_package.version;
    // 如果本地版本和远程版本一致，就不需要升级
    if(remote_version === client_version){
        shell.rm('-rf', temp_path);
        return false;
    }

    shell.echo('开始升级airduct，请保证在root权限下执行');
    shell.cp('-R', `${temp_path}/*`, diranme);
    shell.rm('-rf', temp_path);
    shell.echo('升级airduct完成');
    return true;
}