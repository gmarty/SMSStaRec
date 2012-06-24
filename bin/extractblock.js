#!/usr/bin/env node

/**
 * Extract a block from a ROM at the specified address.
 */

'use strict';

var BlockBuilder = require('./../src/BlockBuilder.js'),
    MemoryDumper = require('./../src/MemoryDumper.js'),
    fs = require('fs'),
    path = require('path'),
    argv = process.argv;

if (argv.indexOf('-h') >= 0 || argv.indexOf('--help') >= 0 ||
    argv[2] == undefined || argv[3] == undefined) {
  console.log('Usage: ' + path.basename(argv[1]) + ' [INPUT_ROM] [ADDRESS]\n' +
      '\n' +
      'Extract a block from a ROM at the specified address.\n');
} else {
  var dumper = new MemoryDumper(fs.readFileSync(argv[2]));
  var compiler = new BlockBuilder(dumper.getMemory());
  console.log(compiler.blockToJS(compiler.parseBranch(argv[3])));
}
