window.z = function(path){

  /** Initialization **/
  
  // Vars
  var imageData, i, memory, stack, pc, sp, I, timer, keys, keys_pressed, xhr, opcodes, tmp, opcode, interval, prefix, NNN, NN, N, X, Y, VX, VY, value, i, j;
  
  // Canvas
  imageData = (c = C.getContext("2d")).createImageData(64, 32);
  
  for(i=64*32*4; i--;){
    imageData.data[i] = i%4-3 ? 255 : 0;
  }

  // Memory
  memory = [];
  
  // Sprites of the characters 0-9,A-F (8*4px) are placed in the 160 first indexes of memory: 0xF0, 0x90, ...
  for(i=80; i--;){
    memory[i] = eval("0x" + "F999F26227F1F8FF1F1F99F11F8F1FF8F9FF1244F9F9FF9F1FF9F99E9E9EF888FE999EF8F8FF8F88"[i] + "0");
  }
  
  // Registers
  V = [];

  // Stack
  stack = [];

  // Program counter
  pc = 512;

  // Stack pointer
  sp = 0;

  // Address register
  I = 0;
  
  // Timer
  timer = 0;
  
  // Sound timer
  // sound_timer = 0;
  
  /** Detect keys pressed **/

  // key map (keycodes to use for each chip8 key: numpad0-9 + QWERTY)
  keys = [96,103,104,105,100,101,102,97,98,99,81,87,69,82,84,89];
  
  // Keys currently pressed
  keys_pressed = [];
  onkeydown = function(e){ keys_pressed[keys.indexOf(e.keyCode)] = !0; }
  onkeyup = function(e){ keys_pressed[keys.indexOf(e.keyCode)] = !1; }

  /** Load ROM **/
  
  xhr = new XMLHttpRequest;
  xhr.open('GET', path);
  xhr.responseType = 'arraybuffer';
  xhr.send();
  xhr.onload = function(){

    // Put ROM in memory
    for(i=(tmp = new Uint8Array(xhr.response)).length; i--;){
      memory[i+512] = tmp[i];
    }
  
    /** Loop **/
    interval = setInterval(function(){
    
      // Decrement the timers
      timer && timer--;
      //sound_timer && sound_timer--;
    
      // Execute 4 opcodes
      for(opcodes = 4; opcodes--;){
        
        //ops++;
        
        // Read opcode
        opcode = memory[pc] << 8 | memory[pc+1];
        //console.log("@"+pc + ": "+("00" + opcode.toString(16)).slice(-4));
        
        // Read opcode fields
        prefix = opcode >> 12;
        NNN = opcode & 0xFFF;
        NN = opcode & 0xFF;
        N = opcode & 0xF;
        X = opcode >> 8 & 0xF;
        VX = V[X];
        VY = V[opcode >> 4 & 0xF];
        
        // 00E0: clear
        if(opcode == 0xE0){
          for(i = 64*32*4; i--;){
            imageData.data[i] = i%4-3 ? 255 : 0;
          }
        }
        
        // 00EE: return from subprogram
        if(opcode == 0xEE){
          pc = stack.pop();
        }
        
        // 1NNN: jump
        if(prefix == 1){
          
          // Game over (if pc doesn't change)
          //if(NNN == pc && o == 3){
          //  clearInterval(interval);
          //}
          
          pc = NNN - 2;
        }
        
        // 2NNN: call subprogram
        if(prefix == 2){
          stack.push(pc);
          pc = NNN - 2;
        }
        
        // 3XNN: ignore next opcode if VX == NN
        // 4XNN: ignore next opcode if VX != NN
        // 5XY0: ignore next opcode if VX == VY
        // 9XY0: ignore next opcode if VX != VY
        // EX9E: ignore next opcode if VX is pressed
        // EXA1: ignore next opcode if VX is not pressed
        if((prefix == 3 && VX == NN)
        || (prefix == 4 && VX != NN)
        || (prefix == 5 && VX == VY)
        || (prefix == 9 && VX != VY) 
        || (prefix == 0xE && ((NN == 0x9E && keys_pressed[VX]) || (NN == 0xA1 && !keys_pressed[VX])))
        ){
          pc += 2;
        }
        
        // 6XNN: set VX to NN
        if(prefix == 6){
          V[X] = NN;
        }
        
        // 7XNN: add NN to VX
        if(prefix == 7){
          V[X] = (VX + NN) & 0xFF;
        }
        
        // 8XYN:
        if(prefix == 8){
          
          // 8XY0: set VX to VY
          if(!N){
            V[X] = VY;
          }
          
          // 8XY1: set VX to VX OR VY
          if(N == 1){
            V[X] |= VY;
          }
          
          // 8XY2: set VX to VX AND VY
          if(N == 2){
            V[X] &= VY;
          }
          
          // 8XY3: set VX to VX XOR VY
          if(N == 3){
            V[X] ^= VY;
          }
          
          // 8XY4: add VY to VX, put carry in VF
          if(N == 4){
            V[X] += VY;
            V[0xF] = VX >> 8;
            V[X] &= 0xFF;
          }
          
          // 8XY5: substract VY to VX, put carry in VF (is it correct?)
          if(N == 5){
            tmp = V[X] -= VY;
            V[0xF] = ~~(tmp < 0);
          }
          
          // 8XY6: right shift VX, put shifted bit in VF
          if(N == 6){
            V[0xF] = VX & 0x1;
            V[X] >>= 1;
          }
          
          // 8XY7: VX = VY - VX, set carry to VF (is it correct?)
          if(N == 7){
            V[0xF] = ~~(VY < VX);
            V[X] = VY - VX;
          }
          
          // 8XYE: left shift VX, put shifted bit in VF
          if(N == 0xE){
            V[0xF] = VX >> 7;
            V[X] <<= 1;
          }
        }
        
        // ANNN: set I to NNN
        if(prefix == 0xA){
          I = NNN;
        }
        
        // BNNN: jump to NNN + V0
        if(prefix == 0xB){
          pc = NNN + V[0];
        }
        
        // CXNN: set VX to a random number < NN
        if(prefix == 0xC){
          V[X] = Math.floor(Math.random() * 512 % (NN + 1));
        }
        
        // DXYN: draw a 8*N px sprite stored at address I at coordinates [X:Y]
        if(prefix == 0xD){
          for(i = N; i--;){
            for(j = 8; j--;){
              value = (memory[I+i]>>(7-j))&0x1;
              if(value){
                tmp = 4*(64*(VY+i)+VX+j)+3;
                imageData.data[tmp] = 255 - imageData.data[tmp];
              }
            }
          }
        }
        
        // FXNN:
        if(prefix == 0xF){
          
          // FX07: set VX to the timer value
          if(NN == 0x07){
            V[X] = timer;
          }
          
          // FX0A: prompt, store key pressed in VX
          if(NN == 0x0A){
          
            // Loop until VX != -1
            if(!~(V[X] = keys_pressed.indexOf(true))){
              pc -= 2; 
            }
          }
          
          // FX15: set timer to VX
          if(NN == 0x15){
            timer = VX;
          }
          
          // FX18: set sound timer to VX 
          //if(NN == 0x18){
            //sound_timer = VX;
          //}
          
          // FX1E: add VX to I, set VF to I's overflow (I>0xFFF)
          if(NN == 0x1E){
            I += VX;
            V[0xF] = (I > 0xFFF) + 0;
            I &= 0xFFF;
          }
          
          // FX29: set I to the character VX
          if(NN == 0x29){
            I = VX * 5;
          }
          
          // FX33: store the decimal value of VX in memory at address I (hundreds), I+1 (dozens), I+2 (units)
          if(NN == 0x33){
            memory[I] = (tmp=(""+VX))[0]; 
            memory[I+1] = tmp[1];
            memory[I+2] = tmp[2];
          }
          
          // FX55: store V0 to VX in memory from address I
          if(NN == 0x55){
            for(i = X; i--;){
              memory[I + i] = V[i];
            }
          }
          
          // FX65: load V0 to VX from memory at address I
          if(NN == 0x65){
            for(i = X; i--;){
              V[i] = memory[I + i];
            }
          }
        }

        // Next instruction
        pc += 2;
      }
      
      // Refresh screen
      c.putImageData(imageData, 0, 0);
      
    },16);
  }
}