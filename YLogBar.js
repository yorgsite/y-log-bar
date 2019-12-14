

const styl = require('node-styl-rgb').c16m;

var _last_bar;
var YLogBar=function(){
	// var scope=this; C:\__perso\web_aspire\YLogBar.js
	_last_bar=this;
	var visible=0;
	var dirty=0;
	var bridge={};
	var drawer=new Drawer(bridge);
	var drawlog=new DrawLog(bridge);

	var ioref={
		size:{
			_dirty:'all',
			get:()=>drawer.size,
			set:(v)=>{
				if(typeof(v)==='number'){
					drawer.size=Math.max(5,Math.min(process.stdout.cols,Math.round(v)));
				}
			}
		},
		time:{
			_type:'block',
			visible:{
				get:()=>drawer.timeShow,
				set:(v)=>{drawer.timeShow=!!v;}
			},
			start:{
				get:()=>drawer.timestart,
				set:(v)=>{
					if(typeof(v)==='number'){
						drawer.timestart=v;
					}
				}
			},
		},
		title:{
			_type:'block',
			value:{
				_dirty:'title',
				get:()=>drawer.title,
				set:(v)=>{
					if(typeof(v)==='string'){
						drawer.title=v;
					}else {
						drawer.title='';
					}
				}
			},
			fill:{
				_type:'ch',
				_tgt:'titleFill'
			},
			front:{
				_type:'fade',
				_dirty:'bar',
				_tgt:'titleFront'
			},
			back:{
				_type:'fade',
				_dirty:'bar',
				_tgt:'titleBack'
			}
		},
		perc:{
			_type:'block',
			value:{
				_dirty:'bar',
				get:()=>drawer.percent,
				set:(v)=>{
					if(typeof(v)==='number'){
						drawer.percent=Math.max(0,Math.min(1,v));
					}
				}
			},
			front:{
				_type:'rgb',
				_tgt:'percFront'
			},
			back:{
				_type:'rgb',
				_tgt:'percBack'
			}
		},
		bar:{
			_type:'block',
			chIn:{
				_type:'ch',
				_dirty:'bar',
				_tgt:'barChIn'
			},
			chOut:{
				_type:'ch',
				_dirty:'bar',
				_tgt:'barChOut'
			},
			front:{
				_type:'fade',
				_dirty:'bar',
				_tgt:'barFront'
			},
			back:{
				_type:'fade',
				_dirty:'bar',
				_tgt:'barBack'
			}
		}
	};
	defineProps(this,ioref,bridge);

//drawer.size=Math.max(5,Math.min(process.stdout.rows,Math.round(v)));
	this.fit=function(){
		drawer.size=process.stdout.columns-1;
		return this;
	};
	// this.getLines=function(){
	// 	return drawlog.getLines();
	// };
	this.show=function(){
		if(visible){
			drawlog.logOut(1);
		}
		drawlog.logIn();
		visible=1;
	};
	this.hide=function(){
		if(visible){
			drawlog.logOut();
			visible=0;
		}
	};
	this.log=function(...args){
		if(visible){
			drawlog.logOut();
		}
		console.log(...args);
		if(visible){
			drawlog.logIn();
		}
	};
};
YLogBar.get=function(){
	if(!_last_bar)new YLogBar();
	return _last_bar;
};


var DrawLog=function(bridge){
	bridge.drawlog=this;
	var visible=0;
	this.dirty={
		'title':1,
		'bar':1
	};
	var buff={
		'title':'',
		'bar':''
	};
	var gRef={
		'title':'getTitleLine',
		'bar':'getBarLine'
	};
	Object.defineProperty(this.dirty,'all',{get:()=>{},set:(v)=>{
		this.dirty.title=this.dirty.bar=!!v;
	}});
	this.getLines=function(){
		for(lp in this.dirty){
			if(this.dirty[lp]){
				buff[lp]=bridge.drawer[gRef[lp]]();
				this.dirty[lp]=0;
			}
		}
		return [buff.title,buff.bar];
	};
	this.logIn=function(){
		console.log(this.getLines().join('\n'));
	};
	this.logOut=function(noClear){
		process.stdout.cursorTo(0);
		process.stdout.moveCursor(0,-1);
		if(!noClear)process.stdout.clearLine();
		process.stdout.moveCursor(0,-1);
		if(!noClear)process.stdout.clearLine();
	};
};
var Drawer=function(bridge){
	bridge.drawer=this;

	this.size=80;
	this.percent=0.0;//▄█

	this.title=' ';
	this.titleFill=' ';
	this.titleFront=[[255,255,255],[255,255,255]];
	this.titleBack=[[0,60,120],[0,30,80]];

	this.barChIn='█';
	this.barChOut='─';
	this.barFront	= [[0,240,0],[150,200,0]];
	this.barBack	= [[0,80,35],[25,50,0]];

	this.percFront	= [200,230,255];
	this.percBack	= [0,0,0];

	this.timeShow	= 0;
	this.timestart	= 0;

	this.getFade=function(line,fronts,backs){
		let perc,f,b,chars=line.split('');
		return chars.map((c,i)=>{
			perc=i/(chars.length-1);
			f=fronts[0].map((v,k)=>v*(1-perc)+fronts[1][k]*perc);
			b=backs[0].map((v,k)=>v*(1-perc)+backs[1][k]*perc);
			return styl(c).front(f).back(b)+'';
		}).join('');
	};
	let txtimeref=[{mod:1000,len:3},{mod:60,len:2},{mod:60,len:2},{mod:24,len:2}];
	this.sliceTime=function(ms){
		return txtimeref.map((r,i)=>{
			let str = (ms%r.mod)+'';
			if(str.length<r.len)str='0'.repeat(r.len-str.length)+str;
			ms=Math.floor(ms/r.mod);
			return str;
		}).reverse();
	};
	this.getTimeTxt=function(){
		if(this.timeShow){
			let time=Date.now();
			if(!this.timestart)this.timestart=time;
			return this.sliceTime(time-this.timestart).join(':');
		};
		return '';
	};
	this.getTitleLine=function(){
		let txt = styl.none(this.title);
		let txtime=this.getTimeTxt();
		if(txt.length>this.size-txtime.length){
			txt=txt.substr(0,this.size-1-txtime.length)+'…';
		}else if (txt.length<this.size-txtime.length) {
			txt+=this.titleFill.repeat(this.size-txt.length-txtime.length);
		}
		txt+=txtime;
		return this.getFade(txt,this.titleFront,this.titleBack);
	};
	this.truePerc=function(){
		return Math.max(0,Math.min(1,this.percent));
	};
	this.getBarLine=function(){
		let perc=this.truePerc();
		let barsize=this.size-4;
		let pi=Math.round(perc*barsize);
		let txt = pi===0?'':this.barChIn.repeat(pi);
		if(pi<barsize)txt+=this.barChOut.repeat(barsize-pi);
		return this.getPerc()+
		this.getFade(txt,this.barFront,this.barBack);
		// this.getPerc();
	};
	this.getPerc=function(){
		let perc=Math.round(this.truePerc()*100);
		let str=perc+'%';
		str=' '.repeat(4-str.length)+str;
		return styl(str).front(this.percFront).back(this.percBack)+'';
	};
	this.getLines=function(){
		return [this.getTitleLine(),this.getBarLine()];
	};
};

var defineProps=function(tgt,ref,tgtdat){
	let drawer=tgtdat.drawer;
	let drawlog=tgtdat.drawlog;
	for(let prop in ref){
		if(prop.charAt(0)!=='_'){
			let hdirty=ref[prop]._dirty;
			if(ref[prop]._type==='block'){
				let obj={};
				defineProps(obj,ref[prop],tgtdat);
				Object.defineProperty(tgt,prop,{get:()=>obj,enumerable:true});
			}else if(ref[prop]._type==='ch'){
				let ct=ref[prop]._tgt;
				Object.defineProperty(tgt,prop,{
					get:()=>drawer[ct],
					set:(v)=>{
						if(typeof(v)==='string'&&v.length===1){
							drawer[ct]=v;
							if(hdirty){drawlog.dirty[hdirty]=1;}
						}
					},enumerable:true
				});
			}else if(ref[prop]._type==='rgb'){
				let ct=ref[prop]._tgt;
				Object.defineProperty(tgt,prop,{
					get:()=>drawer[ct].map(v=>v),
					set:(v)=>{
						if((v instanceof Array)&&v.length===3&&v.filter(n=>typeof(n)==='number').length===3){
							drawer[ct]=v.map(n=>n);
							if(hdirty){drawlog.dirty[hdirty]=1;}
						}
					},enumerable:true
				});
			}else if(ref[prop]._type==='rgbf'){
				let ct=ref[prop]._tgt;
				let id=ref[prop]._id;
				Object.defineProperty(tgt,prop,{
					get:()=>drawer[ct][id].map(v=>v),
					set:(v)=>{
						if((v instanceof Array)&&v.length===3&&v.filter(n=>typeof(n)==='number').length===3){
							drawer[ct][id]=v.map(n=>n);
							if(hdirty){drawlog.dirty[hdirty]=1;}
						}
					},enumerable:true
				});
			}else if(ref[prop]._type==='fade'){
				let ct=ref[prop]._tgt;
				let nuref={};
				nuref[prop]={
					_type:'block',
					from:{_type:'rgbf',_tgt:ct,_id:0,_dirty:hdirty},
					to:{_type:'rgbf',_tgt:ct,_id:1,_dirty:hdirty}
				};
				defineProps(tgt,nuref,tgtdat);
			}else if('get' in ref[prop]){
				ref[prop].enumerable=true;
				if(hdirty&&ref[prop].set){
					let hset=ref[prop].set;
					ref[prop].set=(v)=>{
						hset(v);
						drawlog.dirty[hdirty]=1;
					}
				}
				Object.defineProperty(tgt,prop,ref[prop]);
			}
		}
	}
};

module.exports = YLogBar;
