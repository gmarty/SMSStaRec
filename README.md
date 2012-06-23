# SMS Static Recompiler

This project is an attempt to perform static compilation of Sega Master System and GameGear ROMs down to pure JavaScript.

## Current state

The project is working on simple homebrew ROMs.

## How is it working?

This project is based on (jsSMS)[https://github.com/gmarty/jsSMS], a Sega Master System and GameGear emulator written in JavaScript.

The compiler looks for branches starting at each possible address of the ROM data.
Then it follows the instructions while their order can be predicted.
Whenever it finds a Jump or a Call instruction (including Jump relative, Return...), the branch ends.

## What to do from now?

* Extract only branches required by the ROM.
* Include conditional Jump instructions.
* Use a parser/lexer to generate and analysis JavaScript.

## License

SMS Static Compiler - An attempt to compile statically SMS/GG ROMs to pure JavaScript.
Copyright (C) 2012  Guillaume Marty (https://github.com/gmarty)
Based on JavaGear Copyright (c) 2002-2008 Chris White

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
