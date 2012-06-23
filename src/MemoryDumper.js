/**
 * Class for abstracting memory dumping.
 * Works in both browsers and node.js.
 */

'use strict';


/**
 * Size of each memory page (1K in this case).
 * @const
 */
var PAGE_SIZE = 0x400;



/**
 * A class to abstract ROM memory dumping to JavaScript array.
 *
 * @param {string|Buffer} data The raw data of a ROM file.
 * @constructor
 */
var MemoryDumper = function(data) {
  var i;

  this.isBuffer = (typeof Buffer != 'undefined' && Buffer.isBuffer(data));

  this.size = data.length;
  // Strip 512 Byte File Headers
  if ((this.size % 1024) != 0) {
    if (this.isBuffer) {
      data = data.slice(512);
    } else {
      data = data.substr(512);
    } // skip 512 bytes
    this.size -= 512;
  }

  this.data = [];

  if (this.size <= PAGE_SIZE) {
    this.size = null;
    throw 'ROM is probably invalid (size is below page size).';
  }

  if (this.isBuffer) {
    for (i = 0; i < this.size; i++) {
      this.data[i] = data.readUInt8(i);
    }
  } else {
    for (i = 0; i < this.size; i++) {
      this.data[i] = data.charCodeAt(i) & 0xFF;
    }
  }
};


/**
 * Return the memory of the ROM as a JavaScript array.
 *
 * @return {Array.<number>} An array representing the ROM memory.
 */
MemoryDumper.prototype.getMemory = function() {
  return this.data;
};


/**
 * Compute page memory. Not used atm, but probably useful in the future.
 *
 * @return {Array}
 */
MemoryDumper.prototype.getPagedMemory = function() {
  // Calculate number of pages from file size and create array appropriately
  var i, j;
  var number_of_pages = Math.round(this.size / PAGE_SIZE);
  var pages = new Array(number_of_pages);

  for (i = 0; i < number_of_pages; i++) {
    pages[i] = new Array(PAGE_SIZE);
    // Read file into pages array
    // second value is offset, third is length
    //is.read(pages[i / Setup.PAGE_SIZE], 0x0000, Setup.PAGE_SIZE);
    for (j = 0; j < PAGE_SIZE; j++) {
      pages[i][j] = this.data[(i * PAGE_SIZE) + j];
    }
  }

  return pages;
};


/**
 * Return the size of the currently loaded ROM.
 *
 * @return {?number} The size of the ROM in memory.
 */
MemoryDumper.prototype.getSize = function() {
  return this.size;
};

if (typeof module != 'undefined' && module.exports != undefined) {
  module.exports = MemoryDumper;
} else {
  window['MemoryDumper'] = MemoryDumper;
  window['MemoryDumper'].prototype['getMemory'] = MemoryDumper.prototype.getMemory;
  window['MemoryDumper'].prototype['getPagedMemory'] = MemoryDumper.prototype.getPagedMemory;
  window['MemoryDumper'].prototype['getSize'] = MemoryDumper.prototype.getSize;
}
