#!/usr/bin/env node

var yargs = require('yargs');

var argv = yargs
    .option('create', {
        type: 'string',
        describe: 'create new project',
        alias: 'ct'
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

    .example('waterway create', 'create project successfully!')
    .example('waterway update', 'update successfully!')
    .example('waterway router', 'create router successfully!')
    .example('waterway publish', 'publish project successfully!')
    .help('h')
    .alias('h', 'help')
    .epilog('copyright 2018')
    .argv;
['create', 'update', 'router', 'publish'].forEach(function(key){
    if(argv[key]){
        console.log(argv, argv[key]);
        const gitpath = argv._[0];
        require('./libs/' + key)(gitpath, argv[key]);
    }
});