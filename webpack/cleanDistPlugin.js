const shell = require("shelljs");
/**
 * 清理编译目录
 */
class CleanDistPlugin{
    constructor(options){
        this.opts = {
            output: options.output
        }
    }
    remove(){
        shell.rm('-rf',this.opts.output);
    }
    apply(compiler) {
        compiler.plugin("entryOption",  (compilation) => {
            if(this.opts.output){
                this.remove()
            }
        });
    }
}
module.exports = CleanDistPlugin