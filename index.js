#!/usr/bin/env node

var yargs = require('yargs');

var argv = yargs
    .option('env', {
        type: 'string',
        describe: 'process env'
    })
    .example('airduct init', 'init project successfully!')
    .example('airduct run', 'run successfully!')
    .example('airduct update', 'update successfully!')
    .example('airduct router', 'create router successfully!')
    .example('airduct publish', 'publish project successfully!')
    .help('h')
    .alias('h', 'help')
    .epilog('copyright 2018')
    .argv;
['init', 'run', 'update', 'router', 'publish'].forEach(function(key){
    const handle = argv._[0];
    if(handle === key){
        require('./libs/' + key)(argv);
    }
});