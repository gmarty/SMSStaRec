/**
 * The main class for static recompilation of SMS/GG ROMs.
 *
 * Optimizations already performed:
 *  * strip_empty_inst:
 *      Don't show the opcode comment if there's no action attached.
 *  * strip_tstates_decrement:
 *      Don't decrement this.tstate if the value to decrement is 0.
 *  * merge_tstates_decrement:
 *      Merge and move all TStates decrement statements at the end of a branch.
 *  * inline_ei_inst:
 *      Statically check this.EI_inst and don't test interrupt if true.
 *
 * \@todo Implement the following optimizations:
 *  * Generate a slow path (similar to what is currently generated) and a fast
 *     path checking that cyclesTo > sum of all this.tstates. In this case,
 *     remove this.tstates > cyclesTo checks (@see http://robert.ocallahan.org/2010/11/implementing-high-performance-emulator_01.html).
 *  * Wrap branches in while(1) loops and emit a `continue` when it calls the
 *     same opcode as the current one (Thus avoiding infinite loops?).
 *  * Check if this.tstates > cyclesTo inside branches.
 *  * Inline more stuff (Non branch ending complex inst...).
 *  * Inline JR/JP/Call instructions as a condition. If no, continue the branch.
 *  * We should use an AST parser/lexer to generate and analyse instructions.
 */


/**
 * The max number of instructions per branch to avoid infinite loops.
 * @const
 */
var MAX_INSTRUCTION_NB = 10;


/**
 * Size of each memory page (1K in this case).
 * @type {number}
 */
var PAGE_SIZE = 0x400;


/** @const */
var Setup = {
  ACCURATE_INTERRUPT_EMULATION: true
};


/**
 * All instructions that end a branch (JP, JR, CALL, RET and RST).
 */
var JPinst = [0xC2, 0xC3, 0xCA, 0xD2, 0xDA, 0xE2, 0xE9, 0xEA, 0xF2, 0xFA];

var JRinst = [0x10, 0x18, 0x20, 0x28, 0x30, 0x38];

var CALLinst = [0xC4, 0xCC, 0xCD, 0xD4, 0xDC, 0xE4, 0xEC, 0xF4, 0xFC];

var RETinst = [0xC0, 0xC8, 0xC9, 0xD0, 0xD8, 0xE0, 0xE8, 0xF0, 0xF8];

var RSTInst = [0xC7, 0xCF, 0xD7, 0xDF, 0xE7, 0xEF, 0xF7, 0xFF];

var miscInst = [0xDD, 0xFD, 0xED, 0x76];

var endingInst = [].concat(JPinst, JRinst, CALLinst, RETinst, RSTInst, miscInst);

// Side effect free opcodes.
var emptyInst = [0x00, 0x40, 0x49, 0x52, 0x5B, 0x64, 0x6D, 0x7F];


/**
 * @const
 */
var OP_STATES = [
  /*         0  1  2  3  4  5  6  7  8  9  A  B  C  D  E  F */
  /* 0x00 */ 4, 10, 7, 6, 4, 4, 7, 4, 4, 11, 7, 6, 4, 4, 7, 4,
  /* 0x10 */ 8, 10, 7, 6, 4, 4, 7, 4, 12, 11, 7, 6, 4, 4, 7, 4,
  /* 0x20 */ 7, 10, 16, 6, 4, 4, 7, 4, 7, 11, 16, 6, 4, 4, 7, 4,
  /* 0x30 */ 7, 10, 13, 6, 11, 11, 10, 4, 7, 11, 13, 6, 4, 4, 7, 4,
  /* 0x40 */ 4, 4, 4, 4, 4, 4, 7, 4, 4, 4, 4, 4, 4, 4, 7, 4,
  /* 0x50 */ 4, 4, 4, 4, 4, 4, 7, 4, 4, 4, 4, 4, 4, 4, 7, 4,
  /* 0x60 */ 4, 4, 4, 4, 4, 4, 7, 4, 4, 4, 4, 4, 4, 4, 7, 4,
  /* 0x70 */ 7, 7, 7, 7, 7, 7, 4, 7, 4, 4, 4, 4, 4, 4, 7, 4,
  /* 0x80 */ 4, 4, 4, 4, 4, 4, 7, 4, 4, 4, 4, 4, 4, 4, 7, 4,
  /* 0x90 */ 4, 4, 4, 4, 4, 4, 7, 4, 4, 4, 4, 4, 4, 4, 7, 4,
  /* 0xA0 */ 4, 4, 4, 4, 4, 4, 7, 4, 4, 4, 4, 4, 4, 4, 7, 4,
  /* 0xB0 */ 4, 4, 4, 4, 4, 4, 7, 4, 4, 4, 4, 4, 4, 4, 7, 4,
  /* 0xC0 */ 5, 10, 10, 10, 10, 11, 7, 11, 5, 10, 10, 0, 10, 17, 7, 11,
  /* 0xD0 */ 5, 10, 10, 11, 10, 11, 7, 11, 5, 4, 10, 11, 10, 0, 7, 11,
  /* 0xE0 */ 5, 10, 10, 19, 10, 11, 7, 11, 5, 4, 10, 4, 10, 0, 7, 11,
  /* 0xF0 */ 5, 10, 10, 4, 10, 11, 7, 11, 5, 6, 10, 4, 10, 0, 7, 11
];



/**
 * @constructor
 */
var BlockBuilder = function(readMem) {
  this.readMem = readMem;
  this.readMemLength = readMem.length * PAGE_SIZE;

  this.debugLevel = 0;

  // Enable or disable various optimizations.
  this.optimizations = {
    strip_empty_inst: true,
    strip_tstates_decrement: true,
    merge_tstates_decrement: false,
    inline_ei_inst: true
  };
};


/**
 * Generate a branch starting at address `pc` and containing at most
 * `MAX_INSTRUCTION_NB` instructions.
 * Return an object containing the address and an array of instructions.
 *
 * @param {number} pc
 * @return {Object.<string, *>}
 */
BlockBuilder.prototype.parseBranch = function(pc) {
  var branch = {
    label: pc,
    insts: []
  };
  var opcode = 0x00;
  var instruction_nb = 0;

  this.pc = pc;
  this.EI_inst = false;
  this.tstatesDecrementVal = 0;

  while (!this.isEndingInst(opcode) &&
      this.pc < this.readMemLength &&
      instruction_nb < MAX_INSTRUCTION_NB) {
    opcode = this.readMem[this.pc >> 10][this.pc & 0x3FF];
    branch.insts.push(this.parseInst(opcode));
    instruction_nb++;
  }

  // Remove the last test.
  branch.insts[branch.insts.length - 1] = branch.insts[branch.insts.length - 1].substr(0, branch.insts[branch.insts.length - 1].length - ('if (this.tstates <= cyclesTo) return;'.length)).trim();

  // this.tstates merge optimization.
  if (this.optimizations.merge_tstates_decrement && this.tstatesDecrementVal) {
    branch.insts[branch.insts.length - 1] += '\n' +
        '\n' +
        'this.tstates -= ' + this.tstatesDecrementVal + ';   // Decrement TStates';
  }

  return branch;
};


/**
 * Get the instructions associated to `opcode` as a string.
 *
 * @param {number} opcode
 * @return {string}
 */
BlockBuilder.prototype.parseInst = function(opcode) {
  // First let's build some generic glue code.
  var preinst = [];
  var inst = '';
  var postinst = [];
  var tstatesDecremetValue = OP_STATES[opcode];

  this.tstatesDecrementVal += tstatesDecremetValue;

  if (this.debugLevel >= 1) {
    preinst.push('l(\'pc: ' + this.toHex(this.pc) + ',\t' +
        'opcode: ' + this.toHex(opcode) + ',\t' +
        'tstates: \' + this.tstates + \',\t' +
        'cyclesTo: \' + cyclesTo);');
  } else {
    preinst.push('// pc: ' + this.toHex(this.pc) + ',\t' +
        'opcode: ' + this.toHex(opcode));
  }

  // Inline EI_inst optimization.
  if (Setup.ACCURATE_INTERRUPT_EMULATION) {
    if (this.optimizations.inline_ei_inst && !this.EI_inst) {
      preinst.push('if (this.interruptLine)' + '\n' +
          '  this.interrupt();  // Check for interrupt');
    }
    if (!this.optimizations.inline_ei_inst) {
      preinst.push('this.EI_inst = false;');
    }
  }

  preinst.push('this.pc++;');

  // Strip tstates decrement if possible.
  if (!this.optimizations.merge_tstates_decrement && (!this.optimizations.strip_tstates_decrement || tstatesDecremetValue)) {
    preinst.push('this.tstates -= ' + tstatesDecremetValue + ';   // Decrement TStates');
  }

  // It's safe to increment program counter here.
  this.pc++;

  if (!this.optimizations.strip_empty_inst || !this.isEmptyInst(opcode)) {
    // We get and clean the instructions.
    inst = this.opcodeToInst(opcode)
      .toString()
      .replace(/function \(\) {/, '')
      .replace(/}$/, '')
      .trim()
      .replace(/^\s+/gm, '');

    // Then, we statically analysis the code to increment `this.pc` value.
    this.pc += (inst.split('this.pc++').length) - 1; // Appears twice in 0x01, 0x11 and 0x21.
    if (inst.indexOf('this.pc += 2;') > 0) {
      this.pc += 2;
    }
    if (inst.indexOf('this.pc += 3;') > 0) {
      this.pc += 3;
    }
    if (inst.indexOf('this.pc--') > 0) {
      //this.pc--;
    }

    // Inline EI_inst optimization.
    if (this.optimizations.inline_ei_inst) {
      if (inst.indexOf('this.EI_inst = true;') > 0) {
        this.EI_inst = true;
        inst = inst.replace(/this\.EI_inst \= true;/g, '').trim();
      } else {
        this.EI_inst = false;
      }
    }
  }

  postinst.push('if (this.tstates <= cyclesTo) return;');

  var ret = (preinst.join('\n') + '\n' + inst)
    .trim() + '\n' + postinst.join('\n')
    .trim();
  //ret = ret.replace(/\bthis\./g, 'self.');
  return ret;
};


/**
 * Generate JavaScript code from an internal block object.
 *
 * @param {Object} block
 * @param {string=} indent
 * @return {string} JavaScript code associated to the block.
 */
BlockBuilder.prototype.blockToJS = function(block, indent) {
  if (typeof indent == 'undefined') {
    indent = '';
  }

  return '' +
      indent + '// New branch starting at ' + this.toHex(block.label) + ' / ' + block.insts.length + ' instructions' + '\n' +
      ((this.debugLevel >= 2) ? indent + 'l(\'New branch starting at ' + this.toHex(block.label) + ' / ' + block.insts.length + ' instructions\');' + '\n' : '') +
      block.insts.join('\n\n').replace(/(.+)/mg, function(line) {
        return indent + line;
      }) + '\n';
};


/**
 * Check if an instruction should end a branch.
 *
 * @param {number} opcode
 * @return {boolean} Whether the instruction is a branch ending or not.
 */
BlockBuilder.prototype.isEndingInst = function(opcode) {
  return endingInst.indexOf(opcode) >= 0;
};


/**
 * Check if an opcode is empty.
 *
 * @param {number} opcode
 * @return {boolean} Whether the opcode is side effect free.
 */
BlockBuilder.prototype.isEmptyInst = function(opcode) {
  return emptyInst.indexOf(opcode) >= 0;
};


/**
 * Get a hex from a decimal. Pad with 0 if necessary.
 *
 * @param {number} dec A decimal integer.
 * @return {string} A hex representation of the input.
 */
BlockBuilder.prototype.toHex = function(dec) {
  var hex = (dec).toString(16);
  if (hex.length == 1) {
    hex = '0' + hex;
  }
  return '0x' + hex;
};


/**
 * Read from a memory location.
 *
 * @param {number} address Memory location.
 * @return {number} Value from memory location.
 */
BlockBuilder.prototype.readMem = function(address) {
  return this.memReadMap[address >> 10][address & 0x3FF] & 0xFF;
};


/**
 * Read a word (two bytes) from a memory location.
 *
 * @param {number} address Memory address.
 * @return {number} Value from memory location.
 */
BlockBuilder.prototype.readMemWord = function(address) {
  return (this.memReadMap[address >> 10][address & 0x3FF] & 0xFF) |
      ((this.memReadMap[++address >> 10][address & 0x3FF] & 0xFF) << 8);
};


/**
 * Return JS code associated to an `opcode`.
 *
 * @param {number} opcode The input opcode.
 * @return {Function} The JS code associated.
 */
BlockBuilder.prototype.opcodeToInst = function(opcode) {
  var self = this;
  var opcodeToInst = {
    0x00: function() {
      // NOP
    },
    0x01: function() {
      // LD BC,nn
      this.c = this.readMem(this.pc++);
      this.b = this.readMem(this.pc++);
    },
    0x02: function() {
      // LD (BC),A
      this.writeMem(this.getBC(), this.a);
    },
    0x03: function() {
      // INC BC
      this.incBC();
    },
    0x04: function() {
      // INC B
      this.b = this.inc8(this.b);
    },
    0x05: function() {
      // DEC B
      this.b = this.dec8(this.b);
    },
    0x06: function() {
      // LD B,n
      this.b = this.readMem(this.pc++);
    },
    0x07: function() {
      // RLCA
      this.rlca_a();
    },
    0x08: function() {
      // EX AF AF'
      this.exAF();
    },
    0x09: function() {
      // ADD HL,BC
      this.setHL(this.add16(this.getHL(), this.getBC()));
    },
    0x0A: function() {
      // LD A,(BC)
      this.a = this.readMem(this.getBC());
    },
    0x0B: function() {
      // DEC BC
      this.decBC();
    },
    0x0C: function() {
      // INC C
      this.c = this.inc8(this.c);
    },
    0x0D: function() {
      // DEC C
      this.c = this.dec8(this.c);
    },
    0x0E: function() {
      // LD C,n
      this.c = this.readMem(this.pc++);
    },
    0x0F: function() {
      // RRCA
      this.rrca_a();
    },
    0x10: function() {
      // DJNZ (PC+e)
      this.b = (this.b - 1) & 0xff;
      this.jr(this.b != 0);
    },
    0x11: function() {
      // LD DE,nn
      this.e = this.readMem(this.pc++);
      this.d = this.readMem(this.pc++);
    },
    0x12: function() {
      // LD (DE), A
      this.writeMem(this.getDE(), this.a);
    },
    0x13: function() {
      // INC DE
      this.incDE();
    },
    0x14: function() {
      // INC D
      this.d = this.inc8(this.d);
    },
    0x15: function() {
      // DEC D
      this.d = this.dec8(this.d);
    },
    0x16: function() {
      // LD D,n
      this.d = (this.readMem(this.pc++));
    },
    0x17: function() {
      // RLA
      this.rla_a();
    },
    0x18: function() {
      // JR (PC+e)
      this.pc += this.d_() + 1;
    },
    0x19: function() {
      // ADD HL,DE
      this.setHL(this.add16(this.getHL(), this.getDE()));
    },
    0x1A: function() {
      // LD A,(DE)
      this.a = this.readMem(this.getDE());
    },
    0x1B: function() {
      // DEC DE
      this.decDE();
    },
    0x1C: function() {
      // INC E
      this.e = this.inc8(this.e);
    },
    0x1D: function() {
      // DEC E
      this.e = this.dec8(this.e);
    },
    0x1E: function() {
      // LD E,N
      this.e = this.readMem(this.pc++);
    },
    0x1F: function() {
      // RRA
      this.rra_a();
    },
    0x20: function() {
      // JR NZ,(PC+e)
      this.jr(!((this.f & F_ZERO) != 0));
    },
    0x21: function() {
      // LD HL,nn
      this.l = this.readMem(this.pc++);
      this.h = this.readMem(this.pc++);
    },
    0x22: function() {
      // LD (nn),HL
      var location = this.readMemWord(this.pc);
      this.writeMem(location, this.l);
      this.writeMem(++location, this.h);
      this.pc += 2;
    },
    0x23: function() {
      // INC HL
      this.incHL();
    },
    0x24: function() {
      // INC H
      this.h = this.inc8(this.h);
    },
    0x25: function() {
      // DEC H
      this.h = this.dec8(this.h);
    },
    0x26: function() {
      // LD H,n
      this.h = this.readMem(this.pc++);
    },
    0x27: function() {
      // DAA
      this.daa();
    },
    0x28: function() {
      // JR Z,(PC+e)
      this.jr(((this.f & F_ZERO) != 0));
    },
    0x29: function() {
      // ADD HL,HL
      this.setHL(this.add16(this.getHL(), this.getHL()));
    },
    0x2A: function() {
      var location = this.readMemWord(this.pc);
      this.l = this.readMem(location);
      this.h = this.readMem(location + 1);
      this.pc += 2;
    },
    0x2B: function() {
      // DEC HL
      this.decHL();
    },
    0x2C: function() {
      // INC L
      this.l = this.inc8(this.l);
    },
    0x2D: function() {
      // DEC L
      this.l = this.dec8(this.l);
    },
    0x2E: function() {
      // LD L,n
      this.l = this.readMem(this.pc++);
    },
    0x2F: function() {
      // CPL
      this.cpl_a();
    },
    0x30: function() {
      // JR NC,(PC+e)
      this.jr(!((this.f & F_CARRY) != 0));
    },
    0x31: function() {
      // LD SP,nn
      this.sp = this.readMemWord(this.pc);
      this.pc += 2;
    },
    0x32: function() {
      // LD (nn),A
      this.writeMem(this.readMemWord(this.pc), this.a);
      this.pc += 2;
    },
    0x33: function() {
      // INC SP
      this.sp++;
    },
    0x34: function() {
      // INC (HL)
      this.incMem(this.getHL());
    },
    0x35: function() {
      // DEC (HL)
      this.decMem(this.getHL());
    },
    0x36: function() {
      // LD (HL),n
      this.writeMem(this.getHL(), this.readMem(this.pc++));
    },
    0x37: function() {
      // SCF
      this.f |= F_CARRY;
      this.f &= ~F_NEGATIVE;
      this.f &= ~F_HALFCARRY;
    },
    0x38: function() {
      // JR C,(PC+e)
      this.jr((this.f & F_CARRY) != 0);
    },
    0x39: function() {
      // ADD HL,SP
      this.setHL(this.add16(this.getHL(), this.sp));
    },
    0x3A: function() {
      // LD A,(nn)
      this.a = this.readMem(this.readMemWord(this.pc));
      this.pc += 2;
    },
    0x3B: function() {
      // DEC SP
      this.sp--;
    },
    0x3C: function() {
      // INC A
      this.a = this.inc8(this.a);
    },
    0x3D: function() {
      // DEC A
      this.a = this.dec8(this.a);
    },
    0x3E: function() {
      // LD A,n
      this.a = this.readMem(this.pc++);
    },
    0x3F: function() {
      // CCF
      this.ccf();
    },
    0x40: function() {
      // LD B,B
    },
    0x41: function() {
      // LD B,C
      this.b = this.c;
    },
    0x42: function() {
      // LD B,D
      this.b = this.d;
    },
    0x43: function() {
      // LD B,E
      this.b = this.e;
    },
    0x44: function() {
      // LD B,H
      this.b = this.h;
    },
    0x45: function() {
      // LD B,L
      this.b = this.l;
    },
    0x46: function() {
      // LD B,(HL)
      this.b = this.readMem(this.getHL());
    },
    0x47: function() {
      // LD B,A
      this.b = this.a;
    },
    0x48: function() {
      // LD C,B
      this.c = this.b;
    },
    0x49: function() {
      // LD C,C
    },
    0x4A: function() {
      // LD C,D
      this.c = this.d;
    },
    0x4B: function() {
      // LD C,E
      this.c = this.e;
    },
    0x4C: function() {
      // LD C,H
      this.c = this.h;
    },
    0x4D: function() {
      // LD C,L
      this.c = this.l;
    },
    0x4E: function() {
      // LD C,(HL)
      this.c = this.readMem(this.getHL());
    },
    0x4F: function() {
      // LD C,A
      this.c = this.a;
    },
    0x50: function() {
      // LD D,B
      this.d = this.b;
    },
    0x51: function() {
      // LD D,C
      this.d = this.c;
    },
    0x52: function() {
      // LD D,D
    },
    0x53: function() {
      // LD D,E
      this.d = this.e;
    },
    0x54: function() {
      // LD D,H
      this.d = this.h;
    },
    0x55: function() {
      // LD D,L
      this.d = this.l;
    },
    0x56: function() {
      // LD D,(HL)
      this.d = this.readMem(this.getHL());
    },
    0x57: function() {
      // LD D,A
      this.d = this.a;
    },
    0x58: function() {
      // LD E,B
      this.e = this.b;
    },
    0x59: function() {
      // LD E,C
      this.e = this.c;
    },
    0x5A: function() {
      // LD E,D
      this.e = this.d;
    },
    0x5B: function() {
      // LD E,E
    },
    0x5C: function() {
      // LD E,H
      this.e = this.h;
    },
    0x5D: function() {
      // LD E,L
      this.e = this.l;
    },
    0x5E: function() {
      // LD E,(HL)
      this.e = this.readMem(this.getHL());
    },
    0x5F: function() {
      // LD E,A
      this.e = this.a;
    },
    0x60: function() {
      // LD H,B
      this.h = this.b;
    },
    0x61: function() {
      // LD H,C
      this.h = this.c;
    },
    0x62: function() {
      // LD H,D
      this.h = this.d;
    },
    0x63: function() {
      // LD H,E
      this.h = this.e;
    },
    0x64: function() {
      // LD H,H
    },
    0x65: function() {
      // LD H,L
      this.h = this.l;
    },
    0x66: function() {
      // LD H,(HL)
      this.h = this.readMem(this.getHL());
    },
    0x67: function() {
      // LD H,A
      this.h = this.a;
    },
    0x68: function() {
      // LD L,B
      this.l = this.b;
    },
    0x69: function() {
      // LD L,C
      this.l = this.c;
    },
    0x6A: function() {
      // LD L,D
      this.l = this.d;
    },
    0x6B: function() {
      // LD L,E
      this.l = this.e;
    },
    0x6C: function() {
      // LD L,H
      this.l = this.h;
    },
    0x6D: function() {
      // LD L,L
    },
    0x6E: function() {
      // LD L,(HL)
      this.l = this.readMem(this.getHL());
    },
    0x6F: function() {
      // LD L,A
      this.l = this.a;
    },
    0x70: function() {
      // LD (HL),B
      this.writeMem(this.getHL(), this.b);
    },
    0x71: function() {
      // LD (HL),C
      this.writeMem(this.getHL(), this.c);
    },
    0x72: function() {
      // LD (HL),D
      this.writeMem(this.getHL(), this.d);
    },
    0x73: function() {
      // LD (HL),E
      this.writeMem(this.getHL(), this.e);
    },
    0x74: function() {
      // LD (HL),H
      this.writeMem(this.getHL(), this.h);
    },
    0x75: function() {
      // LD (HL),L
      this.writeMem(this.getHL(), this.l);
    },
    0x76: function() {
      // HALT
      if (HALT_SPEEDUP) this.tstates = 0;
      this.halt = true;
      this.pc--;
    },
    0x77: function() {
      // LD (HL),A
      this.writeMem(this.getHL(), this.a);
    },
    0x78: function() {
      // LD A,B
      this.a = this.b;
    },
    0x79: function() {
      // LD A,C
      this.a = this.c;
    },
    0x7A: function() {
      // LD A,D
      this.a = this.d;
    },
    0x7B: function() {
      // LD A,E
      this.a = this.e;
    },
    0x7C: function() {
      // LD A,H
      this.a = this.h;
    },
    0x7D: function() {
      // LD A,L
      this.a = this.l;
    },
    0x7E: function() {
      // LD A,(HL)
      this.a = this.readMem(this.getHL());
    },
    0x7F: function() {
      // LD A,A
    },
    0x80: function() {
      // ADD A,B
      this.add_a(this.b);
    },
    0x81: function() {
      // ADD A,C
      this.add_a(this.c);
    },
    0x82: function() {
      // ADD A,D
      this.add_a(this.d);
    },
    0x83: function() {
      // ADD A,E
      this.add_a(this.e);
    },
    0x84: function() {
      // ADD A,H
      this.add_a(this.h);
    },
    0x85: function() {
      // ADD A,L
      this.add_a(this.l);
    },
    0x86: function() {
      // ADD A,(HL)
      this.add_a(this.readMem(this.getHL()));
    },
    0x87: function() {
      // ADD A,A
      this.add_a(this.a);
    },
    0x88: function() {
      // ADC A,B
      this.adc_a(this.b);
    },
    0x89: function() {
      // ADC A,C
      this.adc_a(this.c);
    },
    0x8A: function() {
      // ADC A,D
      this.adc_a(this.d);
    },
    0x8B: function() {
      // ADC A,E
      this.adc_a(this.e);
    },
    0x8C: function() {
      // ADC A,H
      this.adc_a(this.h);
    },
    0x8D: function() {
      // ADC A,L
      this.adc_a(this.l);
    },
    0x8E: function() {
      // ADC A,(HL)
      this.adc_a(this.readMem(this.getHL()));
    },
    0x8F: function() {
      // ADC A,A
      this.adc_a(this.a);
    },
    0x90: function() {
      // SUB A,B
      this.sub_a(this.b);
    },
    0x91: function() {
      // SUB A,C
      this.sub_a(this.c);
    },
    0x92: function() {
      // SUB A,D
      this.sub_a(this.d);
    },
    0x93: function() {
      // SUB A,E
      this.sub_a(this.e);
    },
    0x94: function() {
      // SUB A,H
      this.sub_a(this.h);
    },
    0x95: function() {
      // SUB A,L
      this.sub_a(this.l);
    },
    0x96: function() {
      // SUB A,(HL)
      this.sub_a(this.readMem(this.getHL()));
    },
    0x97: function() {
      // SUB A,A
      this.sub_a(this.a);
    },
    0x98: function() {
      // SBC A,B
      this.sbc_a(this.b);
    },
    0x99: function() {
      // SBC A,C
      this.sbc_a(this.c);
    },
    0x9A: function() {
      // SBC A,D
      this.sbc_a(this.d);
    },
    0x9B: function() {
      // SBC A,E
      this.sbc_a(this.e);
    },
    0x9C: function() {
      // SBC A,H
      this.sbc_a(this.h);
    },
    0x9D: function() {
      // SBC A,L
      this.sbc_a(this.l);
    },
    0x9E: function() {
      // SBC A,(HL)
      this.sbc_a(this.readMem(this.getHL()));
    },
    0x9F: function() {
      // SBC A,A
      this.sbc_a(this.a);
    },
    0xA0: function() {
      // AND A,B
      this.f = this.SZP_TABLE[this.a &= this.b] | F_HALFCARRY;
    },
    0xA1: function() {
      // AND A,C
      this.f = this.SZP_TABLE[this.a &= this.c] | F_HALFCARRY;
    },
    0xA2: function() {
      // AND A,D
      this.f = this.SZP_TABLE[this.a &= this.d] | F_HALFCARRY;
    },
    0xA3: function() {
      // AND A,E
      this.f = this.SZP_TABLE[this.a &= this.e] | F_HALFCARRY;
    },
    0xA4: function() {
      // AND A,H
      this.f = this.SZP_TABLE[this.a &= this.h] | F_HALFCARRY;
    },
    0xA5: function() {
      // AND A,L
      this.f = this.SZP_TABLE[this.a &= this.l] | F_HALFCARRY;
    },
    0xA6: function() {
      // AND A,(HL)
      this.f = this.SZP_TABLE[this.a &= this.readMem(this.getHL())] | F_HALFCARRY;
    },
    0xA7: function() {
      // AND A,A
      this.f = this.SZP_TABLE[this.a] | F_HALFCARRY;
    },
    0xA8: function() {
      // XOR A,B
      this.f = this.SZP_TABLE[this.a ^= this.b];
    },
    0xA9: function() {
      // XOR A,C
      this.f = this.SZP_TABLE[this.a ^= this.c];
    },
    0xAA: function() {
      // XOR A,D
      this.f = this.SZP_TABLE[this.a ^= this.d];
    },
    0xAB: function() {
      // XOR A,E
      this.f = this.SZP_TABLE[this.a ^= this.e];
    },
    0xAC: function() {
      // XOR A,H
      this.f = this.SZP_TABLE[this.a ^= this.h];
    },
    0xAD: function() {
      // XOR A,L
      this.f = this.SZP_TABLE[this.a ^= this.l];
    },
    0xAE: function() {
      // XOR A,(HL)
      this.f = this.SZP_TABLE[this.a ^= this.readMem(this.getHL())];
    },
    0xAF: function() {
      // XOR A,A (=0)
      this.f = this.SZP_TABLE[this.a = 0];
    },
    0xB0: function() {
      // OR A,B
      this.f = this.SZP_TABLE[this.a |= this.b];
    },
    0xB1: function() {
      // OR A,C
      this.f = this.SZP_TABLE[this.a |= this.c];
    },
    0xB2: function() {
      // OR A,D
      this.f = this.SZP_TABLE[this.a |= this.d];
    },
    0xB3: function() {
      // OR A,E
      this.f = this.SZP_TABLE[this.a |= this.e];
    },
    0xB4: function() {
      // OR A,H
      this.f = this.SZP_TABLE[this.a |= this.h];
    },
    0xB5: function() {
      // OR A,L
      this.f = this.SZP_TABLE[this.a |= this.l];
    },
    0xB6: function() {
      // OR A,(HL)
      this.f = this.SZP_TABLE[this.a |= this.readMem(this.getHL())];
    },
    0xB7: function() {
      // OR A,A
      this.f = this.SZP_TABLE[this.a];
    },
    0xB8: function() {
      // CP A,B
      this.cp_a(this.b);
    },
    0xB9: function() {
      // CP A,C
      this.cp_a(this.c);
    },
    0xBA: function() {
      // CP A,D
      this.cp_a(this.d);
    },
    0xBB: function() {
      // CP A,E
      this.cp_a(this.e);
    },
    0xBC: function() {
      // CP A,H
      this.cp_a(this.h);
    },
    0xBD: function() {
      // CP A,L
      this.cp_a(this.l);
    },
    0xBE: function() {
      // CP A,(HL)
      this.cp_a(this.readMem(this.getHL()));
    },
    0xBF: function() {
      // CP A,A
      this.cp_a(this.a);
    },
    0xC0: function() {
      // RET NZ
      this.ret((this.f & F_ZERO) == 0);
    },
    0xC1: function() {
      // POP BC
      this.setBC(this.readMemWord(this.sp));
      this.sp += 2;
    },
    0xC2: function() {
      // JP NZ,(nn)
      this.jp((this.f & F_ZERO) == 0);
    },
    0xC3: function() {
      // JP (nn)
      this.pc = this.readMemWord(this.pc);
    },
    0xC4: function() {
      // CALL NZ (nn)
      this.call((this.f & F_ZERO) == 0);
    },
    0xC5: function() {
      // PUSH BC
      this.push(this.b, this.c);
    },
    0xC6: function() {
      // ADD A,n
      this.add_a(this.readMem(this.pc++));
    },
    0xC7: function() {
      // RST 00H
      this.push(this.pc);
      this.pc = 0x00;
    },
    0xC8: function() {
      // RET Z
      this.ret((this.f & F_ZERO) != 0);
    },
    0xC9: function() {
      // RET
      this.pc = this.readMemWord(this.sp);
      this.sp += 2;
    },
    0xCA: function() {
      // JP Z,(nn)
      this.jp((this.f & F_ZERO) != 0);
    },
    0xCB: function() {
      // CB Opcode
      this.doCB(this.readMem(this.pc++));
    },
    0xCC: function() {
      // CALL Z (nn)
      this.call((this.f & F_ZERO) != 0);
    },
    0xCD: function() {
      // CALL (nn)
      this.push(this.pc + 2);
      this.pc = this.readMemWord(this.pc);
    },
    0xCE: function() {
      // ADC A,n
      this.adc_a(this.readMem(this.pc++));
    },
    0xCF: function() {
      // RST 08H
      this.push(this.pc);
      this.pc = 0x08;
    },
    0xD0: function() {
      // RET NC
      this.ret((this.f & F_CARRY) == 0);
    },
    0xD1: function() {
      // POP DE
      this.setDE(this.readMemWord(this.sp));
      this.sp += 2;
    },
    0xD2: function() {
      // JP NC,(nn)
      this.jp((this.f & F_CARRY) == 0);
    },
    0xD3: function() {
      // OUT (n),A
      this.port.out(this.readMem(this.pc++), this.a);
    },
    0xD4: function() {
      // CALL NC (nn)
      this.call((this.f & F_CARRY) == 0);
    },
    0xD5: function() {
      // PUSH DE
      this.push(this.d, this.e);
    },
    0xD6: function() {
      // SUB n
      this.sub_a(this.readMem(this.pc++));
    },
    0xD7: function() {
      // RST 10H
      this.push(this.pc);
      this.pc = 0x10;
    },
    0xD8: function() {
      // RET C
      this.ret(((this.f & F_CARRY) != 0));
    },
    0xD9: function() {
      // EXX
      this.exBC();
      this.exDE();
      this.exHL();
    },
    0xDA: function() {
      // JP C,(nn)
      this.jp((this.f & F_CARRY) != 0);
    },
    0xDB: function() {
      // IN A,(n)
      this.a = this.port.in_(this.readMem(this.pc++));
    },
    0xDC: function() {
      // CALL C (nn)
      this.call((this.f & F_CARRY) != 0);
    },
    0xDD: function() {
      // DD Opcode
      this.doIndexOpIX(this.readMem(this.pc++));
    },
    0xDE: function() {
      // SBC A,n
      this.sbc_a(this.readMem(this.pc++));
    },
    0xDF: function() {
      // RST 18H
      this.push(this.pc);
      this.pc = 0x18;
    },
    0xE0: function() {
      // RET PO
      this.ret((this.f & F_PARITY) == 0);
    },
    0xE1: function() {
      // POP HL
      this.setHL(this.readMemWord(this.sp));
      this.sp += 2;
    },
    0xE2: function() {
      // JP PO,(nn)
      this.jp((this.f & F_PARITY) == 0);
    },
    0xE3: function() {
      // EX (SP),HL
      var temp = this.h;
      this.h = this.readMem(this.sp + 1);
      this.writeMem(this.sp + 1, temp);
      temp = this.l;
      this.l = this.readMem(this.sp);
      this.writeMem(this.sp, temp);
    },
    0xE4: function() {
      // CALL PO (nn)
      this.call((this.f & F_PARITY) == 0);
    },
    0xE5: function() {
      // PUSH HL
      this.push(this.h, this.l);
    },
    0xE6: function() {
      // AND (n)
      this.f = this.SZP_TABLE[this.a &= this.readMem(this.pc++)] | F_HALFCARRY;
    },
    0xE7: function() {
      // RST 20H
      this.push(this.pc);
      this.pc = 0x20;
    },
    0xE8: function() {
      // RET PE
      this.ret((this.f & F_PARITY) != 0);
    },
    0xE9: function() {
      // JP (HL)
      this.pc = this.getHL();
    },
    0xEA: function() {
      // JP PE,(nn)
      this.jp((this.f & F_PARITY) != 0);
    },
    0xEB: function() {
      // EX DE,HL
      var temp = this.d;
      this.d = this.h;
      this.h = temp;
      temp = this.e;
      this.e = this.l;
      this.l = temp;
    },
    0xEC: function() {
      // CALL PE (nn)
      this.call((this.f & F_PARITY) != 0);
    },
    0xED: function() {
      // ED Opcode
      this.doED(this.readMem(this.pc));
    },
    0xEE: function() {
      // XOR n
      this.f = this.SZP_TABLE[this.a ^= this.readMem(this.pc++)];
    },
    0xEF: function() {
      // RST 28H
      this.push(this.pc);
      this.pc = 0x28;
    },
    0xF0: function() {
      // RET P
      this.ret((this.f & F_SIGN) == 0);
    },
    0xF1: function() {
      // POP AF
      this.f = this.readMem(this.sp++);
      this.a = this.readMem(this.sp++);
    },
    0xF2: function() {
      // JP P,(nn)
      this.jp((this.f & F_SIGN) == 0);
    },
    0xF3: function() {
      // DI
      this.iff1 = this.iff2 = false;
      this.EI_inst = true;
    },
    0xF4: function() {
      // CALL P (nn)
      this.call((this.f & F_SIGN) == 0);
    },
    0xF5: function() {
      // PUSH AF
      this.push(this.a, this.f);
    },
    0xF6: function() {
      // OR n
      this.f = this.SZP_TABLE[this.a |= this.readMem(this.pc++)];
    },
    0xF7: function() {
      // RST 30H
      this.push(this.pc);
      this.pc = 0x30;
    },
    0xF8: function() {
      // RET M
      this.ret((this.f & F_SIGN) != 0);
    },
    0xF9: function() {
      // LD SP,HL
      this.sp = this.getHL();
    },
    0xFA: function() {
      // JP M,(nn)
      this.jp((this.f & F_SIGN) != 0);
    },
    0xFB: function() {
      // EI
      this.iff1 = this.iff2 = true;
      this.EI_inst = true;
    },
    0xFC: function() {
      // CALL M (nn)
      this.call((this.f & F_SIGN) != 0);
    },
    0xFD: function() {
      // FD Opcode
      this.doIndexOpIY(this.readMem(this.pc++));
    },
    0xFE: function() {
      // CP n
      this.cp_a(this.readMem(this.pc++));
    },
    0xFF: function() {
      // RST 38H
      this.push(this.pc);
      this.pc = 0x38;
    }
  };
  return opcodeToInst[opcode];
};

// Variables to allow compilation.
/** Speedup hack to set tstates to '0' on halt instruction. */
/** @const */ var HALT_SPEEDUP = false;

/** carry (set when a standard carry occurred). */
/** @const */ var F_CARRY = 0x01;

/** negative (set when instruction is subtraction, clear when addition). */
/** @const */ var F_NEGATIVE = 0x02;

/** true indicates even parity in the result, false for 2s complement sign overflow. */
/** @const */ var F_PARITY = 0x04;

/** half carry (set when a carry occured between bit 3 / 4 of result - used for BCD. */
/** @const */ var F_HALFCARRY = 0x10;

/** zero (set when a result is zero). */
/** @const */ var F_ZERO = 0x40;

/** sign (set when a result is negative). */
/** @const */ var F_SIGN = 0x80;

if (typeof module != 'undefined' && module.exports != undefined) {
  module.exports = BlockBuilder;
} else {
  window['BlockBuilder'] = BlockBuilder;
  window['BlockBuilder'].prototype['parseBranch'] = BlockBuilder.prototype.parseBranch;
  window['BlockBuilder'].prototype['parseInst'] = BlockBuilder.prototype.parseInst;
  window['BlockBuilder'].prototype['blockToJS'] = BlockBuilder.prototype.blockToJS;
}
