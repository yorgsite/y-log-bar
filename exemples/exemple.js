//const logbar	= require('y-log-bar').get();
const logbar	= require('../YLogBar.js').get();

logbar.time.visible=true;
logbar.title.value=' Counting...';
logbar.show();

let loops=2000,stoplog=200;

for(let i=0;i<loops;i++){
	logbar.title.value=' Counting '+(i+1)+'/'+loops;
	logbar.perc.value=i/(loops-1);
	if(i<stoplog){
		logbar.log('Jack says '+i);
	}else if(i===stoplog){
		logbar.log(' --- SHUT UP Jack !');
	}else {
		logbar.show();// force refresh
	}
}
setTimeout(()=>{
	logbar.hide();
},2000);
