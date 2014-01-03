window.z = function(path){

  /** Initialization **/

  // Vars
  var imageData, audio, oscillator, i, memory, stack, pc, sp, I, timer, sound_timer, keys, keys_pressed, xhr, opcodes, tmp, opcode, interval, prefix, NNN, NN, N, X, Y, VX, VY, value, i, j, x, y;

  // Canvas
  imageData = (c = C.getContext("2d")).createImageData(64, 32);

  // All pixels are white, we just toggle their opacity to have black / white
  for(i=64*32*4; i--;){
    imageData.data[i] = i%4-3 ? 255 : 0;
  }

  // Audio
  audio = AudioContext && new AudioContext;

  // Memory
  memory = [];

  // Sprites of the characters 0-9,A-F (8*5px) are placed in the 160 first indexes of memory: 0xF0, 0x90, ...
  for(i=80; i--;){
    memory[i] = eval("0x" + "F999F26227F1F8FF1F1F99F11F8F1FF8F9FF1244F9F9FF9F1FF9F99E9E9EF888FE999EF8F8FF8F88"[i] + "0");
  }

  // Registers
  V = new Uint8Array(new ArrayBuffer(16));

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
  sound_timer = 0;

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

      // Decrement the timers while > 0
      timer && timer--;
      sound_timer && sound_timer--;
      
      // Start sound if sound timer > 0
      if(audio && sound_timer && !oscillator){
        
        // New oscillator
        oscillator = audio.createOscillator();
        
        // Cross-browser start/stop
        if(!oscillator.start){
          oscillator.noteOn = oscillator.start;
        }
        if(!oscillator.stop){
          oscillator.noteOff = oscillator.stop;
        }
        
        // Start sound
        oscillator.connect(audio.destination);
        oscillator.type = 3;
        oscillator.start(0);
      }
      
      // Stop sound if sound timer == 0
      if(audio && !sound_timer && oscillator){
        oscillator.stop(0);
        oscillator = 0;
      }

      // Execute 4 opcodes
      for(opcodes = 4; opcodes--;){

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

        // 1NNN: jump to NNN
        if(prefix == 1){
          pc = NNN - 2;
        }

        // 2NNN: call subprogram at NNN
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
          V[X] = VX + NN;
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
            V[0xF] = +((V[X] += VY) > 0xFF);
          }

          // 8XY5: substract VY to VX, put NOT borrow in VF
          if(N == 5){
            V[0xF] = +((V[X] -= VY) >= 0);
          }

          // 8XY6: right shift VX, put shifted bit in VF
          if(N == 6){
            V[0xF] = VX & 0x1;
            V[X] /= 2;
          }

          // 8XY7: VX = VY - VX, put NOT borrow in VF
          if(N == 7){
            V[0xF] = +((V[X] = VY - VX) >= 0);
          }

          // 8XYE: left shift VX, put shifted bit in VF
          if(N == 0xE){
            V[0xF] = VX >> 7;
            V[X] *= 2;
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
          V[X] = Math.floor(Math.random() * NN);
        }

        // DXYN: draw the 8*N px sprite stored at address I at coordinates [X:Y]
        if(prefix == 0xD){

          V[0xF] = 0;

          // Loop on the N lines of the sprite
          for(i = N; i--;){

            // Loop on the 8 pixels of the current line of the sprite
            for(j = 8; j--;){

              // Get the value of the pixel
              value = (memory[I+i]>>(7-j))&0x1;

              // Get the coordinates of the pixel
              x = VX + j;
              y = VY + i;

              // If the pixel is on
              if(value){

                // If the pixel is out of bounds, wrap
                if(x > 63){
                  x -= 63;
                }

                if(y > 31){
                  y -= 31;
                }

                // If the pixel is already white, make it black, VF = 1. Else, make it white.
                tmp = 4*(64*y+x)+3;
                if(imageData.data[tmp]){
                  imageData.data[tmp] = 0;
                  V[0xF] = 1;
                }
                else{
                  imageData.data[tmp] = 255;
                }
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
            if(!~(V[X] = keys_pressed.indexOf(!0))){
              pc -= 2;
            }
          }

          // FX15: set timer to VX
          if(NN == 0x15){
            timer = VX;
          }

          // FX18: set sound timer to VX
          if(NN == 0x18){
            sound_timer = VX;
          }

          // FX1E: add VX to I, set VF to I's overflow (I>0xFFF)
          if(NN == 0x1E){
            I += VX;
            V[0xF] = +(I > 0xFFF);
            I &= 0xFFF;
          }

          // FX29: set I to the character VX
          if(NN == 0x29){
            I = VX * 5;
          }

          // FX33: store the decimal value of VX in memory at address I (hundreds), I+1 (dozens), I+2 (units)
          if(NN == 0x33){
            for(i = 3; i--;){
              memory[I+i]=(""+VX)[i];
            }
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