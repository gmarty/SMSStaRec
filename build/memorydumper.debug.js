'use strict';function $Buffer$$() {
}
$Buffer$$.prototype.slice = function $$Buffer$$$$slice$() {
};
function $MemoryDumper$$($data$$21$$) {
  var $i$$1$$;
  this.isBuffer = "undefined" != typeof $Buffer$$ && void 0;
  this.size = $data$$21$$.length;
  0 != this.size % 1024 && ($data$$21$$ = this.isBuffer ? $data$$21$$.slice(512) : $data$$21$$.substr(512), this.size -= 512);
  this.data = [];
  if(1024 >= this.size) {
    throw this.size = null, "ROM is probably invalid (size is below page size).";
  }
  if(this.isBuffer) {
    for($i$$1$$ = 0;$i$$1$$ < this.size;$i$$1$$++) {
      this.data[$i$$1$$] = void 0
    }
  }else {
    for($i$$1$$ = 0;$i$$1$$ < this.size;$i$$1$$++) {
      this.data[$i$$1$$] = $data$$21$$.charCodeAt($i$$1$$) & 255
    }
  }
}
$MemoryDumper$$.prototype.$getMemory$ = function $$MemoryDumper$$$$$getMemory$$() {
  return this.data
};
$MemoryDumper$$.prototype.$getPagedMemory$ = function $$MemoryDumper$$$$$getPagedMemory$$() {
  var $i$$2$$, $j$$, $number_of_pages$$ = Math.round(this.size / 1024), $pages$$ = Array($number_of_pages$$);
  for($i$$2$$ = 0;$i$$2$$ < $number_of_pages$$;$i$$2$$++) {
    $pages$$[$i$$2$$] = Array(1024);
    for($j$$ = 0;1024 > $j$$;$j$$++) {
      $pages$$[$i$$2$$][$j$$] = this.data[1024 * $i$$2$$ + $j$$]
    }
  }
  return $pages$$
};
$MemoryDumper$$.prototype.$getSize$ = function $$MemoryDumper$$$$$getSize$$() {
  return this.size
};
window.MemoryDumper = $MemoryDumper$$;
window.MemoryDumper.prototype.getMemory = $MemoryDumper$$.prototype.$getMemory$;
window.MemoryDumper.prototype.getPagedMemory = $MemoryDumper$$.prototype.$getPagedMemory$;
window.MemoryDumper.prototype.getSize = $MemoryDumper$$.prototype.$getSize$;

