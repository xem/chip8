for(a=3;a<8192;a+=4)q.data[a]=255;

V=new(U=Uint8Array)(16);

D=[];

h=512;

g=r=w=k=0;

s=[];

with(new XMLHttpRequest)
	open("GET",location.hash.slice(1)),
	send(responseType="arraybuffer",
	onload=function(c){
		u=new U(response);
		for(a=3584;a--;)
			n[a+512]=u[a];
		setInterval(function(c){
			w&&w--;
			
			for(F=9;F--;){

				p=n[h]<<8|n[h+1];
				f=p>>12;
				x=p&4095;
				d=p&255;
				l=p&15;
				b=p>>8&15;
				z=V[b];
				m=V[p>>4&15];



				e(

				[

					"if(l)h=D.pop();else for(a=3;8192>a;a+=4)q.data[a]=255",
					"h=x-2",
					"D.push(h),h=x-2",
					"if(z==d)h+=2",
					"if(z!=d)h+=2",
					"if(z==m)h+=2",
					"V[b]=d",
					"V[b]=z+d",

					[

					"V[b]=m",
					"V[b]|=m",
					"V[b]&=m",
					"V[b]^=m",
					"V[15]=+(255<(V[b]+=m))",
					"V[15]=+(0<=(V[b]-=m))",
					"V[15]=z&1;V[b]/=2",
					"V[15]=+(0<=(V[b]=m-z))",,,,,,,
					"V[15]=z>>7;V[b]*=2"

					][l],

					"if(z!=m)h+=2",
					"k=x",
					"h=x+V[0]",
					"V[b]=~~(Math.random()*d)",
					"for(V[15]=0,a=l;a--;)for(B=8;B--;)y=z+B,A=m+a,(n[k+a]>>7-B&1)&&(63<y&&(y-=63),31<A&&(A-=31),u=4*(64*A+y)+3,q.data[u]?q.data[u]=0:(q.data[u]=255,V[15]=1))",
					"if((158==d&&s[z])||(161==d&&!s[z]))h+=2",

					[

					"w=z",
					"k=5*z",,,
					"for(a=b;a--;)V[a]=n[k+a]","V[b]=w",,
					"for(a=b;a--;)n[k+a]=V[a]",
					"~(V[b]=s.indexOf('w'))||(h-=2)",
					"k+=z;V[15]=+(4095<k);k&=4095",,
					"for(a=3;a--;)n[k+a]=(''+z)[a]"

					][d%19-2]

				][f]

				);

				h+=2
			}
			C.putImageData(q,0,0)
		},16)
	});
	
	onkeydown=onkeyup=function(c){s[[0,7,8,9,4,5,6,1,2,3,33,39,21,34,36,41].indexOf(c.keyCode%48)]=c.type[5]}
