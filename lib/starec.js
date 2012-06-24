/**
 * Compile statically a rom to JS code.
 */

'use strict';

var fs = require('fs');
var BlockBuilder = require('../src/BlockBuilder.js');
var MemoryDumper = require('../src/MemoryDumper.js');

function compile(romFile, tgtFile) {
  /**
   * Size of each memory page (1K in this case).
   * @type {number}
   */
  var PAGE_SIZE = 0x400;

  var dumper = new MemoryDumper(fs.readFileSync(romFile));
  var builder = new BlockBuilder(dumper.getMemory());

  console.log('ROM size: %d', dumper.getSize());

  fs.writeFileSync(tgtFile, '', 'ascii');
  var stream = fs.createWriteStream(tgtFile, {
    flags: 'a',
    encoding: 'ascii'
  });

  // Intro template
  //stream.write(fs.readFileSync('./templates/z80-intro.tpl', 'ascii'));

  stream.write('var branches = [\n');

  // Display the ruler.
  process.stdout.write('|');
  for (var i = 1; i < 100 - 1; i++) {
    process.stdout.write('-');
  }
  process.stdout.write('|\n');

  // Generate code for branches.
  var number_of_pages = Math.round(dumper.getSize() / PAGE_SIZE);
  var count = 0;

  for (i = 0; i < number_of_pages; i++) {
    stream.write('  [\n');

    for (var j = 0; j < PAGE_SIZE; j++) {

      stream.write('    function(cyclesTo) {\n');
      stream.write(builder.blockToJS(builder.parseBranch((i * PAGE_SIZE) + j), '      '));
      stream.write('    },\n');

      count++;

      // Display a progress line.
      if (count == Math.round(dumper.getSize() / 100)) {
        process.stdout.write('.');
        count = 0;
      }
    }

    stream.write('  ],\n');
  }

  stream.write('];\n');

  // Outro template
  //stream.write(fs.readFileSync('./templates/z80-outro.tpl', 'ascii'));

  stream.end();

  console.log('\nCompilation done!');
}

module.exports = compile;
