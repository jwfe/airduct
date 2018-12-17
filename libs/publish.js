var crypto = require('crypto');
var fs = require('fs');
var shell = require("shelljs");
var glob = require("glob");
/**
 * 文件hash获取
 * @param {String} filePath 文件路径
 */
function fileHash(filePath){
    var buffer = fs.readFileSync(filePath);
    var fsHash = crypto.createHash('md5');
    fsHash.update(buffer);
    return fsHash.digest('hex');
}
/**
 * 文件比对后的结果
 * @param {String} f1 第一个文件的路径
 * @param {String} f2 第二个文件的路径
 */
function isFileChange(f1, f2){
    return fileHash(f1) !== fileHash(f2);
}

module.exports = function(args){
    //判定git命令是否可用
    if (!shell.which('git')) {
        shell.echo('Sorry, this script requires git');
        shell.exit(1);
        return;
    }
    var env = args['env'];
    var pwd = shell.pwd().stdout;
    var config = require(path.resolve(pwd, "airduct.config"));
    var publish = config.publish;
    var diff = `/home/${publish.user}/project/${config.project_name}_diff`;
    var tmp = `/tmp/${publish.user}_${config.project_name}`;
    var bak = `/tmp/${publish.user}_${config.project_name}_bak`;
    // 没有配置
    if(!publish){
        shell.echo('Sorry, airduct.config need publish config');
        shell.exit(1);
        return
    }
    shell.exec('git checkout master');

    var files = glob.sync(path.resolve(pwd, '**/*'), {ignore: publish.ignore});
    var cp_files = [];
    files.forEach((file)=>{
        if(!file){
            return;
        }
        var relative = path.relative(pwd, file);
        var state = isFileChange(file, path.resolve(diff, relative));
        if(state){
            cp_files.push(file);
        }
    });

    if(!cp_files.length){
        shell.echo('没有可发布的内容!');
        shell.exit(1);
        return;
    }

    shell.echo('本次发布的内容包含：' + JSON.stringify(cp_files));
    //增量包
    cp_files.forEach((file) => {
        var relative = path.relative(pwd, file);
        var cpFile = path.resolve(tmp, relative);
        var cp_dirname = path.dirname(cpFile);
        // 增量包
        shell.mkdir('-p', cp_dirname);
        shell.cp(file, cp_dirname);
    });

    //更新diff目录
    shell.rm('-rf', diff);
    shell.mkdir(diff)
    shell.cp('-R', pwd, diff);

    // 压缩增量包
    var bak_tar = `${publish.user}_${config.project_name}_${+new Date()}.tgz`;
    var bakfile = `${bak}/${bak_tar}`;
    shell.mkdir(bak);
    shell.exec(`tar cvhfz ${bakfile} ${tmp}`);
    // 上传到远程目录
    var ssh = `sudo su - ${publish.user} ssh -c blowfish`;
    var scp = `sudo su - ${publish.user} scp -c blowfish`;
    var remote_bak = `${publish.user}_${config.project_name}_bak_${+new Date()}.tgz`
    var roll_back = [];
    // 分发到远程机器
    publish[env].forEach(host => {
        shell.echo(`current host ${host}`);
        shell.exec(`${scp} ${bakfile} ${host}:${remote}`);
        shell.exec(`${ssh} ${host} "env LC_CTYPE=zh_CN.GB2312 tar cvhfz ~/${remote_bak} ${publish.remote_project}"`);
        shell.exec(`${ssh} ${host} "env LC_CTYPE=zh_CN.GB2312 tar xvfz ${remote}/${bak_tar} -C ${publish.remote_project}" 2>&1 | sed -e 's/^/      /`);
        roll_back.push(`上线完毕，执行此命令恢复原始版本： ${ssh} ${host} tar xvfz ~/${remote_bak} -C ${publish.remote_project} `)
    });
    shell.echo(JSON.stringify(roll_back));
}