window.z = function(path){

  /** Initialization **/
  
  // Vars
  var interval,c,V,s,pc,sp,I,t,st,xhr,m,i,j,o,opcode,prefix,NNN,NN,N,X,Y,tmp,k,km,execute,value,ops=0;
  
  // Canvas
  d = (c = C.getContext("2d")).createImageData(64, 32);
  
  for(i=64*32*4; i--;){
    d.data[i] = i%4-3 ? 255 : 0;
  }

  // Memory
  m = [];
  
  // Sprites of the characters 0-9A-F are placed in memory (8*4px)
  for(i=80; i--;){
    m[i] = eval("0x" + "F999F26227F1F8FF1F1F99F11F8F1FF8F9FF1244F9F9FF9F1FF9F99E9E9EF888FE999EF8F8FF8F88"[i] + "0");
  }
  
  // Registers
  V = [];

  // Stack
  s = [];

  // Program counter
  pc = 512;

  // Stack pointer
  sp = 0;

  // Address register
  I = 0;
  
  // Timer
  t = 0;
  
  // Sound timer
  st = 0;
  
  /** Detect keys pressed **/

  // key map (keycodes to use for each chip8 key: numpad0-9 + QWERTY)
  km = [96,97,98,99,100,101,102,103,104,105,81,87,69,82,84,89];
  
  // Keys currently pressed
  k = {};
  onkeydown = function(e){ k[km.indexOf(e.keyCode)] = !0; }
  onkeyup = function(e){ k[km.indexOf(e.keyCode)] = !1; }

  /** Load ROM **/
  
  xhr = new XMLHttpRequest;
  xhr.open('GET', path);
  xhr.responseType = 'arraybuffer';
  xhr.send();
  xhr.onload = function(){

    // Put ROM in memory
    for(i=(tmp = new Uint8Array(xhr.response)).length; i--;){
      m[i+512] = tmp[i];
    }
  
    /** Loop **/
    interval = setInterval(function(){
    
      // Decrement the timers
      t&&t--;
      st&&st--;
    
      // Execute 4 opcodes
      for(o=4; o--;){
        
        ops++;
        
        //if(ops > 1000){
        //  return;
        //}
        
        // Read opcode
        opcode = m[pc] << 8 | m[pc+1];
        //console.log("@"+pc + ": "+("00" + opcode.toString(16)).slice(-4));
        
        // Read opcode fields
        prefix = opcode >> 12;
        NNN = opcode & 0xFFF;
        NN = opcode & 0xFF;
        N = opcode & 0xF;
        X = opcode >> 8 & 0xF;
        Y = opcode >> 4 & 0xF;
        
        // 00E0: clear
        if(opcode == 0xE0){
          for(i=64*32*4; i--;){
            d.data[i] = i%4-3 ? 255 : 0;
          }
          //console.log("clear");
        }
        
        // 00EE: return from subprogram
        if(opcode == 0xEE){
          pc = s.pop();
          //console.log("return");
        }
        
        // 1NNN: jump
        if(prefix == 1){
          
          // Game over (if pc doesn't change)
          //console.log(NNN, pc, o);
          if(NNN == pc && o == 3){
            clearInterval(interval);
          }
          
          pc = NNN - 2;
          //console.log("jump to "+NNN);
        }
        
        // 2NNN: call subprogram
        if(prefix == 2){
          s.push(pc);
          pc = NNN - 2;
          //console.log("call "+NNN);
        }
        
        // 3XNN: ignore next opcode if VX == NN
        // 4XNN: ignore next opcode if VX != NN
        // 5XY0: ignore next opcode if VX == VY
        // 9XY0: ignore next opcode if VX != VY
        // EX9E: ignore next opcode if VX is pressed
        // EXA1: ignore next opcode if VX is not pressed
        if((prefix == 3 && V[X] == NN) || (prefix == 4 && V[X] != NN) || (prefix == 5 && V[X] == V[Y]) || (prefix == 9 && V[X] != V[Y]) || (prefix == 0xE && ((NN == 0x9E && k[V[X]]) || (NN == 0xA1 && !k[V[X]])))){
          pc += 2;
          //console.log("ignore next");
        }
        else if(prefix == 3 || prefix == 4 || prefix == 5 || prefix == 9 || prefix == 0xE){
          //console.log("don't ignore next");
          if(prefix == 0xE){
            //console.log("key",X)
          }
        }
        
        // 6XNN: set VX to NN
        if(prefix == 6){
          V[X] = NN;
          //console.log("V"+X+"="+NN)
        }
        
        // 7XNN: add NN to VX
        if(prefix == 7){
          V[X] = (V[X] + NN) & 0xFF;
          //console.log("add "+NN+" to V"+X);
        }
        
        // 8XYN: perform the operation N on VX and VY
        if(prefix == 8){
          
          // 8XY0: set VX to VY
          if(!N){
            V[X] = V[Y];
            //console.log("V",X,"=V",Y,"ok");
          }
          
          // 8XY1: set VX to VX or VY
          if(N == 1){
            V[X] = V[X] | V[Y];
            //console.log("V",X,"=V",X,"or V",Y,"ok")
          }
          
          // 8XY2: set VX to VX and VY
          if(N == 2){
            V[X] = V[X] & V[Y];
            //console.log("V",X,"=V",X,"and V",Y,"ok")
          }
          
          // 8XY3: set VX to VX xor VY
          if(N == 3){
            V[X] = V[X] ^ V[Y];
            //console.log("V",X,"=V",X,"xor V",Y,"ok")
          }
          
          // 8XY4: add VY to VX, put carry in VF
          if(N == 4){
            tmp = V[X] += V[Y];
            V[0xF] = ~~(tmp > 0xFF);
            //console.log("V",X,"+=V",Y,"ok")
          }
          
          // 8XY5: substract VY to VX, put carry in VF
          if(N == 5){
            tmp = V[X] -= V[Y];
            V[0xF] = ~~(tmp < 0);
            //console.log("V",X,"-=V",Y,"ok")
          }
          
          // 8XY6: right shift VX, put shifted bit in VF
          if(N == 6){
            V[0xF] = V[X] & 0x1;
            V[X] >>= 1;
            //console.log("V",X,">>=1 ok")
          }
          
          // 8XY7: VX = VY - VX, set carry to VF
          if(N == 7){
            tmp = V[X] = V[Y] - V[X];
            V[0xF] = ~~(tmp < 0);
            //console.log("V",X,"=V",Y,"-V",X,"ok")
          }
          
          // 8XYE: left shift VX, put shifted bit in VF
          if(N == 0xE){
            V[0xF] = (V[X] & 0x8) >> 7;
            V[X] <<= 1;
            //console.log("V",X,"<<=1 ok")
          }
        }
        
        // ANNN: set I to NNN
        if(prefix == 0xA){
          I = NNN;
          //console.log("I="+I.toString(16));
        }
        
        // BNNN: jump to NNN + V0
        if(prefix == 0xB){
          pc = NNN + V[0];
          //console.log("jump ok");
        }
        
        // CXNN: set VX to a random number < NN
        if(prefix == 0xC){
          V[X] = Math.floor(Math.random() * 512 % (NN + 1));
          //console.log("random ok");
        }
        
        // DXYN: draw a 8*N px sprite stored at address I at coordinates [X:Y]
        if(prefix == 0xD){
          //console.log("draw 8*"+N+"px sprite @"+I+" to "+V[X]+":"+V[Y])
          for(i = N; i--;){
            //console.log("line "+i+": "+m[I+i].toString(2));
            for(j = 8; j--;){
              ////console.log("pixel "+i+"x"+j+": "+((m[I]>>(7-j))&0x1));
              value = (m[I+i]>>(7-j))&0x1;
              if(value){
                tmp = 4*(64*(V[Y]+i)+V[X]+j)+3;
                d.data[tmp] = 255 - d.data[tmp];
              }
            }
          }
        }
        
        // FXNN
        if(prefix == 0xF){
          
          // FX07: set VX to the timer value
          if(NN == 0x07){
            V[X] = t;
            //console.log("V",X,"=timer=",V[X]);
          }
          
          // FX0A: prompt, store key pressed in VX
          if(NN == 0x0A){
          }
          
          // FX15: set timer to VX
          if(NN == 0x15){
            //console.log("timer=",V[X]);
            t = V[X];
          }
          
          // FX18: set sound timer to VX 
          if(NN == 0x18){
            //console.log("sound timer=",V[X]);
            st = V[X];
          }
          
          // FX1E: add VX to I, set VF to I's overflow (I>0xFFF)
          if(NN == 0x1E){
            I += V[X];
            V[F] = ~~(I > 0xFFF);
          }
          
          // FX29: set I to the character VX
          if(NN == 0x29){
            I = V[X];
          }
          
          // FX33: store the decimal value of VX in memory at address I, I+1, I+2
          if(NN == 0x33){
            m[I] = (tmp=(""+V[X]))[0]; 
            m[I+1] = tmp[1];
            m[I+2] = tmp[2];
          }
          
          // FX55: store V0 to VX in memory from address I
          if(NN == 0x55){
            for(i = 0; i < X; i++){
              m[I + X] = V[X]
            }
          }
          
          // FX65: load V0 to VX from memory at address I
          if(NN == 0x65){
            for(i = 0; i < X; i++){
              V[X] = m[I + X]
            }
          }
        }

        // Next instruction
        pc += 2;
      }
      
      // Refresh screen
      c.putImageData(d,0,0);
      
    },16);
  }
}