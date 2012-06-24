#!/usr/bin/env node

/**
 * Compile SMS/GG ROMs down to pure JavaScript.
 */

'use strict';

var compile = require('./../lib/starec.js'),
    path = require('path'),
    argv = process.argv;

if (argv.indexOf('-h') >= 0 || argv.indexOf('--help') >= 0 ||
    argv[2] == undefined || argv[3] == undefined) {
  console.log('Usage: ' + path.basename(argv[1]) + ' [INPUT_ROM] [OUTPUT_FILE]\n' +
      '\n' +
      'Compile SMS/GG ROMs down to pure JavaScript.\n');
} else {
  compile(argv[2], argv[3]);
}
