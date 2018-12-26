var path = require('path');
var fs = require('fs');
var shell = require("shelljs");
var glob = require("glob");

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
                    dir['jumpUrl'] = pathItems.jumpUrl || '';
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
                    jumpUrl: '${dir.jumpUrl}',
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

module.exports = RouterPlugin