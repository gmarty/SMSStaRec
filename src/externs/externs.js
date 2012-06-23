/**
 * Misc externs definition.
 */



/**
 * @constructor
 */
var Buffer = function() {};


/**
 * @param {*} a
 * @return {boolean}
 */
Buffer.isBuffer = function(a) {};


/**
 * @type {number}
 */
Buffer.prototype.length;


/**
 * @param {number} offset
 * @param {boolean=} noAssert
 * @return {number}
 */
Buffer.prototype.readUInt8 = function(offset, noAssert) {};


/**
 * @param {number=} start
 * @param {number=} end
 * @return {Buffer}
 */
Buffer.prototype.slice = function(start, end) {};
