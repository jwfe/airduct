#!/usr/bin/env node

var yargs = require('yargs');

var argv = yargs
    .option('init', {
        type: 'string',
        describe: 'init project',
        alias: 'it'
    })
    .option('update', {
        boolean: true,
        default: false,
        describe: 'update all config',
        alias: 'up'
    })
    .option('router', {
        type: 'string',
        describe: 'create router config',
        alias: 'rt'
    })
    .option('publish', {
        type: 'string',
        describe: 'publish project',
        alias: 'pl'
    })

    .example('airduct init', 'init project successfully!')
    .example('airduct update', 'update successfully!')
    .example('airduct router', 'create router successfully!')
    .example('airduct publish', 'publish project successfully!')
    .help('h')
    .alias('h', 'help')
    .epilog('copyright 2018')
    .argv;
['init', 'update', 'router', 'publish'].forEach(function(key){
    const handle = argv._[0];
    if(handle === key){
        require('./libs/' + key)(argv[key]);
    }
});