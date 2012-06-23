'use strict';var $JSCompiler_alias_TRUE$$ = !0;
function $JSCompiler_emptyFn$$() {
  return function() {
  }
}
;var $endingInst$$ = [].concat([194, 195, 202, 210, 218, 226, 233, 234, 242, 250], [16, 24, 32, 40, 48, 56], [196, 204, 205, 212, 220, 228, 236, 244, 252], [192, 200, 201, 208, 216, 224, 232, 240, 248], [199, 207, 215, 223, 231, 239, 247, 255], [221, 253, 237, 118]), $emptyInst$$ = [0, 64, 73, 82, 91, 100, 109, 127], $OP_STATES$$ = [4, 10, 7, 6, 4, 4, 7, 4, 4, 11, 7, 6, 4, 4, 7, 4, 8, 10, 7, 6, 4, 4, 7, 4, 12, 11, 7, 6, 4, 4, 7, 4, 7, 10, 16, 6, 4, 4, 7, 4, 7, 11, 16, 6, 4, 4, 7, 4, 7, 10, 13, 6, 
11, 11, 10, 4, 7, 11, 13, 6, 4, 4, 7, 4, 4, 4, 4, 4, 4, 4, 7, 4, 4, 4, 4, 4, 4, 4, 7, 4, 4, 4, 4, 4, 4, 4, 7, 4, 4, 4, 4, 4, 4, 4, 7, 4, 4, 4, 4, 4, 4, 4, 7, 4, 4, 4, 4, 4, 4, 4, 7, 4, 7, 7, 7, 7, 7, 7, 4, 7, 4, 4, 4, 4, 4, 4, 7, 4, 4, 4, 4, 4, 4, 4, 7, 4, 4, 4, 4, 4, 4, 4, 7, 4, 4, 4, 4, 4, 4, 4, 7, 4, 4, 4, 4, 4, 4, 4, 7, 4, 4, 4, 4, 4, 4, 4, 7, 4, 4, 4, 4, 4, 4, 4, 7, 4, 4, 4, 4, 4, 4, 4, 7, 4, 4, 4, 4, 4, 4, 4, 7, 4, 5, 10, 10, 10, 10, 11, 7, 11, 5, 10, 10, 0, 10, 17, 7, 11, 5, 10, 10, 11, 10, 
11, 7, 11, 5, 4, 10, 11, 10, 0, 7, 11, 5, 10, 10, 19, 10, 11, 7, 11, 5, 4, 10, 4, 10, 0, 7, 11, 5, 10, 10, 4, 10, 11, 7, 11, 5, 6, 10, 4, 10, 0, 7, 11];
function $BlockBuilder$$($readMem$$) {
  this.$readMem$ = $readMem$$;
  this.$debugLevel$ = 2;
  this.$optimizations$ = {$strip_empty_inst$:$JSCompiler_alias_TRUE$$, $strip_tstates_decrement$:$JSCompiler_alias_TRUE$$, $merge_tstates_decrement$:!1, $inline_ei_inst$:$JSCompiler_alias_TRUE$$}
}
$BlockBuilder$$.prototype.$parseBranch$ = function $$BlockBuilder$$$$$parseBranch$$($pc$$) {
  var $branch$$ = {label:$pc$$, $insts$:[]}, $opcode$$, $instruction_nb$$ = 0;
  this.$pc$ = $pc$$;
  this.$EI_inst$ = !1;
  for(this.$tstatesDecrementVal$ = 0;!(0 <= $endingInst$$.indexOf($opcode$$)) && this.$pc$ < this.$readMem$.length && 10 > $instruction_nb$$;) {
    $opcode$$ = this.$readMem$[this.$pc$], $branch$$.$insts$.push(this.$parseInst$($opcode$$)), $instruction_nb$$++
  }
  $branch$$.$insts$[$branch$$.$insts$.length - 1] = $branch$$.$insts$[$branch$$.$insts$.length - 1].substr(0, $branch$$.$insts$[$branch$$.$insts$.length - 1].length - 37).trim();
  this.$optimizations$.$merge_tstates_decrement$ && this.$tstatesDecrementVal$ && ($branch$$.$insts$[$branch$$.$insts$.length - 1] += "\n\nthis.tstates -= " + this.$tstatesDecrementVal$ + ";   // Decrement TStates");
  return $branch$$
};
$BlockBuilder$$.prototype.$parseInst$ = function $$BlockBuilder$$$$$parseInst$$($opcode$$1$$) {
  var $preinst$$ = [], $inst$$ = "", $postinst$$ = [], $tstatesDecremetValue$$ = $OP_STATES$$[$opcode$$1$$];
  this.$tstatesDecrementVal$ += $tstatesDecremetValue$$;
  $preinst$$.push("l('pc: " + $JSCompiler_StaticMethods_toHex$$(this.$pc$) + ",\topcode: " + $JSCompiler_StaticMethods_toHex$$($opcode$$1$$) + ",\ttstates: ' + this.tstates + ',\tcyclesTo: ' + cyclesTo);");
  this.$optimizations$.$inline_ei_inst$ && !this.$EI_inst$ && $preinst$$.push("if (this.interruptLine)\n  this.interrupt();  // Check for interrupt");
  this.$optimizations$.$inline_ei_inst$ || $preinst$$.push("this.EI_inst = false;");
  $preinst$$.push("this.pc++;");
  !this.$optimizations$.$merge_tstates_decrement$ && (!this.$optimizations$.$strip_tstates_decrement$ || $tstatesDecremetValue$$) && $preinst$$.push("this.tstates -= " + $tstatesDecremetValue$$ + ";   // Decrement TStates");
  this.$pc$++;
  if(!this.$optimizations$.$strip_empty_inst$ || !(0 <= $emptyInst$$.indexOf($opcode$$1$$))) {
    if($inst$$ = {"0":$JSCompiler_emptyFn$$(), 1:function() {
      this.$c$ = this.$readMem$(this.$pc$++);
      this.$b$ = this.$readMem$(this.$pc$++)
    }, 2:function() {
      this.$writeMem$(this.$getBC$(), this.$a$)
    }, 3:function() {
      this.$incBC$()
    }, 4:function() {
      this.$b$ = this.$inc8$(this.$b$)
    }, 5:function() {
      this.$b$ = this.$dec8$(this.$b$)
    }, 6:function() {
      this.$b$ = this.$readMem$(this.$pc$++)
    }, 7:function() {
      this.$rlca_a$()
    }, 8:function() {
      this.$exAF$()
    }, 9:function() {
      this.$setHL$(this.$add16$(this.$getHL$(), this.$getBC$()))
    }, 10:function() {
      this.$a$ = this.$readMem$(this.$getBC$())
    }, 11:function() {
      this.$decBC$()
    }, 12:function() {
      this.$c$ = this.$inc8$(this.$c$)
    }, 13:function() {
      this.$c$ = this.$dec8$(this.$c$)
    }, 14:function() {
      this.$c$ = this.$readMem$(this.$pc$++)
    }, 15:function() {
      this.$rrca_a$()
    }, 16:function() {
      this.$b$ = this.$b$ - 1 & 255;
      this.$jr$(0 != this.$b$)
    }, 17:function() {
      this.$e$ = this.$readMem$(this.$pc$++);
      this.$d$ = this.$readMem$(this.$pc$++)
    }, 18:function() {
      this.$writeMem$(this.$getDE$(), this.$a$)
    }, 19:function() {
      this.$incDE$()
    }, 20:function() {
      this.$d$ = this.$inc8$(this.$d$)
    }, 21:function() {
      this.$d$ = this.$dec8$(this.$d$)
    }, 22:function() {
      this.$d$ = this.$readMem$(this.$pc$++)
    }, 23:function() {
      this.$rla_a$()
    }, 24:function() {
      this.$pc$ += this.$d_$() + 1
    }, 25:function() {
      this.$setHL$(this.$add16$(this.$getHL$(), this.$getDE$()))
    }, 26:function() {
      this.$a$ = this.$readMem$(this.$getDE$())
    }, 27:function() {
      this.$decDE$()
    }, 28:function() {
      this.$e$ = this.$inc8$(this.$e$)
    }, 29:function() {
      this.$e$ = this.$dec8$(this.$e$)
    }, 30:function() {
      this.$e$ = this.$readMem$(this.$pc$++)
    }, 31:function() {
      this.$rra_a$()
    }, 32:function() {
      this.$jr$(0 == (this.$f$ & 64))
    }, 33:function() {
      this.$l$ = this.$readMem$(this.$pc$++);
      this.$h$ = this.$readMem$(this.$pc$++)
    }, 34:function() {
      var $location$$21$$ = $JSCompiler_StaticMethods_readMemWord$$(this, this.$pc$);
      this.$writeMem$($location$$21$$, this.$l$);
      this.$writeMem$(++$location$$21$$, this.$h$);
      this.$pc$ += 2
    }, 35:function() {
      this.$incHL$()
    }, 36:function() {
      this.$h$ = this.$inc8$(this.$h$)
    }, 37:function() {
      this.$h$ = this.$dec8$(this.$h$)
    }, 38:function() {
      this.$h$ = this.$readMem$(this.$pc$++)
    }, 39:function() {
      this.$daa$()
    }, 40:function() {
      this.$jr$(0 != (this.$f$ & 64))
    }, 41:function() {
      this.$setHL$(this.$add16$(this.$getHL$(), this.$getHL$()))
    }, 42:function() {
      var $location$$22$$ = $JSCompiler_StaticMethods_readMemWord$$(this, this.$pc$);
      this.$l$ = this.$readMem$($location$$22$$);
      this.$h$ = this.$readMem$($location$$22$$ + 1);
      this.$pc$ += 2
    }, 43:function() {
      this.$decHL$()
    }, 44:function() {
      this.$l$ = this.$inc8$(this.$l$)
    }, 45:function() {
      this.$l$ = this.$dec8$(this.$l$)
    }, 46:function() {
      this.$l$ = this.$readMem$(this.$pc$++)
    }, 47:function() {
      this.$cpl_a$()
    }, 48:function() {
      this.$jr$(0 == (this.$f$ & 1))
    }, 49:function() {
      this.$sp$ = $JSCompiler_StaticMethods_readMemWord$$(this, this.$pc$);
      this.$pc$ += 2
    }, 50:function() {
      this.$writeMem$($JSCompiler_StaticMethods_readMemWord$$(this, this.$pc$), this.$a$);
      this.$pc$ += 2
    }, 51:function() {
      this.$sp$++
    }, 52:function() {
      this.$incMem$(this.$getHL$())
    }, 53:function() {
      this.$decMem$(this.$getHL$())
    }, 54:function() {
      this.$writeMem$(this.$getHL$(), this.$readMem$(this.$pc$++))
    }, 55:function() {
      this.$f$ |= 1;
      this.$f$ &= -3;
      this.$f$ &= -17
    }, 56:function() {
      this.$jr$(0 != (this.$f$ & 1))
    }, 57:function() {
      this.$setHL$(this.$add16$(this.$getHL$(), this.$sp$))
    }, 58:function() {
      this.$a$ = this.$readMem$($JSCompiler_StaticMethods_readMemWord$$(this, this.$pc$));
      this.$pc$ += 2
    }, 59:function() {
      this.$sp$--
    }, 60:function() {
      this.$a$ = this.$inc8$(this.$a$)
    }, 61:function() {
      this.$a$ = this.$dec8$(this.$a$)
    }, 62:function() {
      this.$a$ = this.$readMem$(this.$pc$++)
    }, 63:function() {
      this.$ccf$()
    }, 64:$JSCompiler_emptyFn$$(), 65:function() {
      this.$b$ = this.$c$
    }, 66:function() {
      this.$b$ = this.$d$
    }, 67:function() {
      this.$b$ = this.$e$
    }, 68:function() {
      this.$b$ = this.$h$
    }, 69:function() {
      this.$b$ = this.$l$
    }, 70:function() {
      this.$b$ = this.$readMem$(this.$getHL$())
    }, 71:function() {
      this.$b$ = this.$a$
    }, 72:function() {
      this.$c$ = this.$b$
    }, 73:$JSCompiler_emptyFn$$(), 74:function() {
      this.$c$ = this.$d$
    }, 75:function() {
      this.$c$ = this.$e$
    }, 76:function() {
      this.$c$ = this.$h$
    }, 77:function() {
      this.$c$ = this.$l$
    }, 78:function() {
      this.$c$ = this.$readMem$(this.$getHL$())
    }, 79:function() {
      this.$c$ = this.$a$
    }, 80:function() {
      this.$d$ = this.$b$
    }, 81:function() {
      this.$d$ = this.$c$
    }, 82:$JSCompiler_emptyFn$$(), 83:function() {
      this.$d$ = this.$e$
    }, 84:function() {
      this.$d$ = this.$h$
    }, 85:function() {
      this.$d$ = this.$l$
    }, 86:function() {
      this.$d$ = this.$readMem$(this.$getHL$())
    }, 87:function() {
      this.$d$ = this.$a$
    }, 88:function() {
      this.$e$ = this.$b$
    }, 89:function() {
      this.$e$ = this.$c$
    }, 90:function() {
      this.$e$ = this.$d$
    }, 91:$JSCompiler_emptyFn$$(), 92:function() {
      this.$e$ = this.$h$
    }, 93:function() {
      this.$e$ = this.$l$
    }, 94:function() {
      this.$e$ = this.$readMem$(this.$getHL$())
    }, 95:function() {
      this.$e$ = this.$a$
    }, 96:function() {
      this.$h$ = this.$b$
    }, 97:function() {
      this.$h$ = this.$c$
    }, 98:function() {
      this.$h$ = this.$d$
    }, 99:function() {
      this.$h$ = this.$e$
    }, 100:$JSCompiler_emptyFn$$(), 101:function() {
      this.$h$ = this.$l$
    }, 102:function() {
      this.$h$ = this.$readMem$(this.$getHL$())
    }, 103:function() {
      this.$h$ = this.$a$
    }, 104:function() {
      this.$l$ = this.$b$
    }, 105:function() {
      this.$l$ = this.$c$
    }, 106:function() {
      this.$l$ = this.$d$
    }, 107:function() {
      this.$l$ = this.$e$
    }, 108:function() {
      this.$l$ = this.$h$
    }, 109:$JSCompiler_emptyFn$$(), 110:function() {
      this.$l$ = this.$readMem$(this.$getHL$())
    }, 111:function() {
      this.$l$ = this.$a$
    }, 112:function() {
      this.$writeMem$(this.$getHL$(), this.$b$)
    }, 113:function() {
      this.$writeMem$(this.$getHL$(), this.$c$)
    }, 114:function() {
      this.$writeMem$(this.$getHL$(), this.$d$)
    }, 115:function() {
      this.$writeMem$(this.$getHL$(), this.$e$)
    }, 116:function() {
      this.$writeMem$(this.$getHL$(), this.$h$)
    }, 117:function() {
      this.$writeMem$(this.$getHL$(), this.$l$)
    }, 118:function() {
      this.$halt$ = $JSCompiler_alias_TRUE$$;
      this.$pc$--
    }, 119:function() {
      this.$writeMem$(this.$getHL$(), this.$a$)
    }, 120:function() {
      this.$a$ = this.$b$
    }, 121:function() {
      this.$a$ = this.$c$
    }, 122:function() {
      this.$a$ = this.$d$
    }, 123:function() {
      this.$a$ = this.$e$
    }, 124:function() {
      this.$a$ = this.$h$
    }, 125:function() {
      this.$a$ = this.$l$
    }, 126:function() {
      this.$a$ = this.$readMem$(this.$getHL$())
    }, 127:$JSCompiler_emptyFn$$(), 128:function() {
      this.$add_a$(this.$b$)
    }, 129:function() {
      this.$add_a$(this.$c$)
    }, 130:function() {
      this.$add_a$(this.$d$)
    }, 131:function() {
      this.$add_a$(this.$e$)
    }, 132:function() {
      this.$add_a$(this.$h$)
    }, 133:function() {
      this.$add_a$(this.$l$)
    }, 134:function() {
      this.$add_a$(this.$readMem$(this.$getHL$()))
    }, 135:function() {
      this.$add_a$(this.$a$)
    }, 136:function() {
      this.$adc_a$(this.$b$)
    }, 137:function() {
      this.$adc_a$(this.$c$)
    }, 138:function() {
      this.$adc_a$(this.$d$)
    }, 139:function() {
      this.$adc_a$(this.$e$)
    }, 140:function() {
      this.$adc_a$(this.$h$)
    }, 141:function() {
      this.$adc_a$(this.$l$)
    }, 142:function() {
      this.$adc_a$(this.$readMem$(this.$getHL$()))
    }, 143:function() {
      this.$adc_a$(this.$a$)
    }, 144:function() {
      this.$sub_a$(this.$b$)
    }, 145:function() {
      this.$sub_a$(this.$c$)
    }, 146:function() {
      this.$sub_a$(this.$d$)
    }, 147:function() {
      this.$sub_a$(this.$e$)
    }, 148:function() {
      this.$sub_a$(this.$h$)
    }, 149:function() {
      this.$sub_a$(this.$l$)
    }, 150:function() {
      this.$sub_a$(this.$readMem$(this.$getHL$()))
    }, 151:function() {
      this.$sub_a$(this.$a$)
    }, 152:function() {
      this.$sbc_a$(this.$b$)
    }, 153:function() {
      this.$sbc_a$(this.$c$)
    }, 154:function() {
      this.$sbc_a$(this.$d$)
    }, 155:function() {
      this.$sbc_a$(this.$e$)
    }, 156:function() {
      this.$sbc_a$(this.$h$)
    }, 157:function() {
      this.$sbc_a$(this.$l$)
    }, 158:function() {
      this.$sbc_a$(this.$readMem$(this.$getHL$()))
    }, 159:function() {
      this.$sbc_a$(this.$a$)
    }, 160:function() {
      this.$f$ = this.$SZP_TABLE$[this.$a$ &= this.$b$] | 16
    }, 161:function() {
      this.$f$ = this.$SZP_TABLE$[this.$a$ &= this.$c$] | 16
    }, 162:function() {
      this.$f$ = this.$SZP_TABLE$[this.$a$ &= this.$d$] | 16
    }, 163:function() {
      this.$f$ = this.$SZP_TABLE$[this.$a$ &= this.$e$] | 16
    }, 164:function() {
      this.$f$ = this.$SZP_TABLE$[this.$a$ &= this.$h$] | 16
    }, 165:function() {
      this.$f$ = this.$SZP_TABLE$[this.$a$ &= this.$l$] | 16
    }, 166:function() {
      this.$f$ = this.$SZP_TABLE$[this.$a$ &= this.$readMem$(this.$getHL$())] | 16
    }, 167:function() {
      this.$f$ = this.$SZP_TABLE$[this.$a$] | 16
    }, 168:function() {
      this.$f$ = this.$SZP_TABLE$[this.$a$ ^= this.$b$]
    }, 169:function() {
      this.$f$ = this.$SZP_TABLE$[this.$a$ ^= this.$c$]
    }, 170:function() {
      this.$f$ = this.$SZP_TABLE$[this.$a$ ^= this.$d$]
    }, 171:function() {
      this.$f$ = this.$SZP_TABLE$[this.$a$ ^= this.$e$]
    }, 172:function() {
      this.$f$ = this.$SZP_TABLE$[this.$a$ ^= this.$h$]
    }, 173:function() {
      this.$f$ = this.$SZP_TABLE$[this.$a$ ^= this.$l$]
    }, 174:function() {
      this.$f$ = this.$SZP_TABLE$[this.$a$ ^= this.$readMem$(this.$getHL$())]
    }, 175:function() {
      this.$f$ = this.$SZP_TABLE$[this.$a$ = 0]
    }, 176:function() {
      this.$f$ = this.$SZP_TABLE$[this.$a$ |= this.$b$]
    }, 177:function() {
      this.$f$ = this.$SZP_TABLE$[this.$a$ |= this.$c$]
    }, 178:function() {
      this.$f$ = this.$SZP_TABLE$[this.$a$ |= this.$d$]
    }, 179:function() {
      this.$f$ = this.$SZP_TABLE$[this.$a$ |= this.$e$]
    }, 180:function() {
      this.$f$ = this.$SZP_TABLE$[this.$a$ |= this.$h$]
    }, 181:function() {
      this.$f$ = this.$SZP_TABLE$[this.$a$ |= this.$l$]
    }, 182:function() {
      this.$f$ = this.$SZP_TABLE$[this.$a$ |= this.$readMem$(this.$getHL$())]
    }, 183:function() {
      this.$f$ = this.$SZP_TABLE$[this.$a$]
    }, 184:function() {
      this.$cp_a$(this.$b$)
    }, 185:function() {
      this.$cp_a$(this.$c$)
    }, 186:function() {
      this.$cp_a$(this.$d$)
    }, 187:function() {
      this.$cp_a$(this.$e$)
    }, 188:function() {
      this.$cp_a$(this.$h$)
    }, 189:function() {
      this.$cp_a$(this.$l$)
    }, 190:function() {
      this.$cp_a$(this.$readMem$(this.$getHL$()))
    }, 191:function() {
      this.$cp_a$(this.$a$)
    }, 192:function() {
      this.$ret$(0 == (this.$f$ & 64))
    }, 193:function() {
      this.$setBC$($JSCompiler_StaticMethods_readMemWord$$(this, this.$sp$));
      this.$sp$ += 2
    }, 194:function() {
      this.$jp$(0 == (this.$f$ & 64))
    }, 195:function() {
      this.$pc$ = $JSCompiler_StaticMethods_readMemWord$$(this, this.$pc$)
    }, 196:function() {
      this.call(0 == (this.$f$ & 64))
    }, 197:function() {
      this.push(this.$b$, this.$c$)
    }, 198:function() {
      this.$add_a$(this.$readMem$(this.$pc$++))
    }, 199:function() {
      this.push(this.$pc$);
      this.$pc$ = 0
    }, 200:function() {
      this.$ret$(0 != (this.$f$ & 64))
    }, 201:function() {
      this.$pc$ = $JSCompiler_StaticMethods_readMemWord$$(this, this.$sp$);
      this.$sp$ += 2
    }, 202:function() {
      this.$jp$(0 != (this.$f$ & 64))
    }, 203:function() {
      this.$doCB$(this.$readMem$(this.$pc$++))
    }, 204:function() {
      this.call(0 != (this.$f$ & 64))
    }, 205:function() {
      this.push(this.$pc$ + 2);
      this.$pc$ = $JSCompiler_StaticMethods_readMemWord$$(this, this.$pc$)
    }, 206:function() {
      this.$adc_a$(this.$readMem$(this.$pc$++))
    }, 207:function() {
      this.push(this.$pc$);
      this.$pc$ = 8
    }, 208:function() {
      this.$ret$(0 == (this.$f$ & 1))
    }, 209:function() {
      this.$setDE$($JSCompiler_StaticMethods_readMemWord$$(this, this.$sp$));
      this.$sp$ += 2
    }, 210:function() {
      this.$jp$(0 == (this.$f$ & 1))
    }, 211:function() {
      this.port.$out$(this.$readMem$(this.$pc$++), this.$a$)
    }, 212:function() {
      this.call(0 == (this.$f$ & 1))
    }, 213:function() {
      this.push(this.$d$, this.$e$)
    }, 214:function() {
      this.$sub_a$(this.$readMem$(this.$pc$++))
    }, 215:function() {
      this.push(this.$pc$);
      this.$pc$ = 16
    }, 216:function() {
      this.$ret$(0 != (this.$f$ & 1))
    }, 217:function() {
      this.$exBC$();
      this.$exDE$();
      this.$exHL$()
    }, 218:function() {
      this.$jp$(0 != (this.$f$ & 1))
    }, 219:function() {
      this.$a$ = this.port.$in_$(this.$readMem$(this.$pc$++))
    }, 220:function() {
      this.call(0 != (this.$f$ & 1))
    }, 221:function() {
      this.$doIndexOpIX$(this.$readMem$(this.$pc$++))
    }, 222:function() {
      this.$sbc_a$(this.$readMem$(this.$pc$++))
    }, 223:function() {
      this.push(this.$pc$);
      this.$pc$ = 24
    }, 224:function() {
      this.$ret$(0 == (this.$f$ & 4))
    }, 225:function() {
      this.$setHL$($JSCompiler_StaticMethods_readMemWord$$(this, this.$sp$));
      this.$sp$ += 2
    }, 226:function() {
      this.$jp$(0 == (this.$f$ & 4))
    }, 227:function() {
      var $temp$$ = this.$h$;
      this.$h$ = this.$readMem$(this.$sp$ + 1);
      this.$writeMem$(this.$sp$ + 1, $temp$$);
      $temp$$ = this.$l$;
      this.$l$ = this.$readMem$(this.$sp$);
      this.$writeMem$(this.$sp$, $temp$$)
    }, 228:function() {
      this.call(0 == (this.$f$ & 4))
    }, 229:function() {
      this.push(this.$h$, this.$l$)
    }, 230:function() {
      this.$f$ = this.$SZP_TABLE$[this.$a$ &= this.$readMem$(this.$pc$++)] | 16
    }, 231:function() {
      this.push(this.$pc$);
      this.$pc$ = 32
    }, 232:function() {
      this.$ret$(0 != (this.$f$ & 4))
    }, 233:function() {
      this.$pc$ = this.$getHL$()
    }, 234:function() {
      this.$jp$(0 != (this.$f$ & 4))
    }, 235:function() {
      var $temp$$1$$ = this.$d$;
      this.$d$ = this.$h$;
      this.$h$ = $temp$$1$$;
      $temp$$1$$ = this.$e$;
      this.$e$ = this.$l$;
      this.$l$ = $temp$$1$$
    }, 236:function() {
      this.call(0 != (this.$f$ & 4))
    }, 237:function() {
      this.$doED$(this.$readMem$(this.$pc$))
    }, 238:function() {
      this.$f$ = this.$SZP_TABLE$[this.$a$ ^= this.$readMem$(this.$pc$++)]
    }, 239:function() {
      this.push(this.$pc$);
      this.$pc$ = 40
    }, 240:function() {
      this.$ret$(0 == (this.$f$ & 128))
    }, 241:function() {
      this.$f$ = this.$readMem$(this.$sp$++);
      this.$a$ = this.$readMem$(this.$sp$++)
    }, 242:function() {
      this.$jp$(0 == (this.$f$ & 128))
    }, 243:function() {
      this.$iff1$ = this.$iff2$ = !1;
      this.$EI_inst$ = $JSCompiler_alias_TRUE$$
    }, 244:function() {
      this.call(0 == (this.$f$ & 128))
    }, 245:function() {
      this.push(this.$a$, this.$f$)
    }, 246:function() {
      this.$f$ = this.$SZP_TABLE$[this.$a$ |= this.$readMem$(this.$pc$++)]
    }, 247:function() {
      this.push(this.$pc$);
      this.$pc$ = 48
    }, 248:function() {
      this.$ret$(0 != (this.$f$ & 128))
    }, 249:function() {
      this.$sp$ = this.$getHL$()
    }, 250:function() {
      this.$jp$(0 != (this.$f$ & 128))
    }, 251:function() {
      this.$EI_inst$ = this.$iff1$ = this.$iff2$ = $JSCompiler_alias_TRUE$$
    }, 252:function() {
      this.call(0 != (this.$f$ & 128))
    }, 253:function() {
      this.$doIndexOpIY$(this.$readMem$(this.$pc$++))
    }, 254:function() {
      this.$cp_a$(this.$readMem$(this.$pc$++))
    }, 255:function() {
      this.push(this.$pc$);
      this.$pc$ = 56
    }}[$opcode$$1$$].toString().replace(/function \(\) {/, "").replace(/}$/, "").trim().replace(/^\s+/gm, ""), this.$pc$ += $inst$$.split("this.pc++").length - 1, 0 < $inst$$.indexOf("this.pc += 2;") && (this.$pc$ += 2), 0 < $inst$$.indexOf("this.pc += 3;") && (this.$pc$ += 3), this.$optimizations$.$inline_ei_inst$) {
      0 < $inst$$.indexOf("this.EI_inst = true;") ? (this.$EI_inst$ = $JSCompiler_alias_TRUE$$, $inst$$ = $inst$$.replace(/this\.EI_inst \= true;/g, "").trim()) : this.$EI_inst$ = !1
    }
  }
  $postinst$$.push("if (this.tstates <= cyclesTo) return;");
  return($preinst$$.join("\n") + "\n" + $inst$$).trim() + "\n" + $postinst$$.join("\n").trim()
};
$BlockBuilder$$.prototype.$blockToJS$ = function $$BlockBuilder$$$$$blockToJS$$($block$$, $indent$$) {
  "undefined" == typeof $indent$$ && ($indent$$ = "");
  return"" + $indent$$ + "// New branch starting at " + $JSCompiler_StaticMethods_toHex$$($block$$.label) + " / " + $block$$.$insts$.length + " instructions\n" + (2 <= this.$debugLevel$ ? $indent$$ + "l('New branch starting at " + $JSCompiler_StaticMethods_toHex$$($block$$.label) + " / " + $block$$.$insts$.length + " instructions');\n" : "") + $block$$.$insts$.join("\n\n").replace(/(.+)/mg, function($line$$) {
    return $indent$$ + $line$$
  }) + "\n"
};
function $JSCompiler_StaticMethods_toHex$$($dec_hex$$) {
  $dec_hex$$ = $dec_hex$$.toString(16);
  1 == $dec_hex$$.length && ($dec_hex$$ = "0" + $dec_hex$$);
  return"0x" + $dec_hex$$
}
$BlockBuilder$$.prototype.$readMem$ = function $$BlockBuilder$$$$$readMem$$($address$$) {
  return this.$memReadMap$[$address$$ >> 10][$address$$ & 1023] & 255
};
function $JSCompiler_StaticMethods_readMemWord$$($JSCompiler_StaticMethods_readMemWord$self$$, $address$$1$$) {
  return $JSCompiler_StaticMethods_readMemWord$self$$.$memReadMap$[$address$$1$$ >> 10][$address$$1$$ & 1023] & 255 | ($JSCompiler_StaticMethods_readMemWord$self$$.$memReadMap$[++$address$$1$$ >> 10][$address$$1$$ & 1023] & 255) << 8
}
window.BlockBuilder = $BlockBuilder$$;
window.BlockBuilder.prototype.parseBranch = $BlockBuilder$$.prototype.$parseBranch$;
window.BlockBuilder.prototype.parseInst = $BlockBuilder$$.prototype.$parseInst$;
window.BlockBuilder.prototype.blockToJS = $BlockBuilder$$.prototype.$blockToJS$;

