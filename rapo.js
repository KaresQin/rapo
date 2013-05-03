
/////////////////////////
// reactive programing //
/////////////////////////
define(["jquery", "compose"], function($, Compose){


  var Rp = Compose(function(param){
		var defParam = {
			chain : [],
			beated : [],
			activeFn : []
		}
		$.extend(defParam, param);
		$.extend(this, defParam);
		this.init();
	},{
		init:function(){

			//if there is no chain obj, means chain itself
			if(!this.chain.length){
				this.feedback(this);
			}

			this.resetBeat();
		},
		then : function(rapo){
			var newrapo = Rapo(this);
			newrapo.feedback(rapo);
			//TODO:there is a little bug, if 'this' isn`t a plan rapo
			this.active(function(){
				newrapo.beat(this);
			});

			rapo.active(function(){
				newrapo.beat(rapo);
			});
			newrapo.type = newrapo.type + "_then_" + rapo.type;
			return newrapo;
		},
		none : function(rapo, milliseconds){

			var newrapo = Rapo(this);
			var activeMark = false;

			newrapo.feedback(rapo);
	
			rapo.active(function(){
				activeMark = true;
			});

			this.active(function(){
				activeMark = false;
				newrapo.beat(this);
				setTimeout(function(){
					if(!activeMark){
						newrapo.beat(rapo);
					}
				}, milliseconds);				
			});

	

			newrapo.type = newrapo.type + "_none_" + rapo.type;
			return newrapo;
		},
		feedback:function(rapo){
			var chain = rapo.chain.length ? rapo.chain : [this];

			this.chain = this.chain.concat(chain);
			this.resetBeat();

		},
		resetBeat:function(){
			var beated = [];
			for(var n=0; n<this.chain.length; n++){
				beated.push(false);
			}
			this.beated = beated;
		},
		active:function(callback){
			this.activeFn.push(callback);
			return this;
		},
		exec:function(){
			if(this.checkBeated()){
				this.setUnbeated();
				for(var n=0; n<this.activeFn.length; n++){
					this.activeFn[n] && this.activeFn[n].call(this, n);
				}
				this.setUnbeated();
			}

		},
		setUnbeated:function(ind){
			var index = ind != null ? ind : 0;
			for(var n=index; n<this.chain.length; n++){
				this.beated[index] = false;
			}
		},
		checkBeated:function(){
			var allBeated = true;
			for(var n=0; n<this.beated.length; n++){
				if(!this.beated[n]){
					allBeated = false;
					break;
				}
			}
			return allBeated;

		},
		beat:function(rapo){
			var index = getIndexOf(this.chain, rapo || this);
			if(this.beated[index-1] != false && index != -1){
				this.beated[index] = true;
				this.setUnbeated(index+1);
			}
			this.exec();
		}

	})

	function getIndexOf(array, elem){
		for(var n=0; n<array.length; n++){
			if(array[n] === elem){
				return n;
			}
		}
		return -1;
	}



	
	function Rapo(param){

		var callback, rapos = [], newrapo, arg = arguments, i=0, type = [];
		while(arg[i]){
			callback = typeof arg[i] === "function" ? arg[i] : null;
			if(typeof arg[i] === "object"){
				rapos.push(arg[i])
				type.push("(" + arg[i].type + ")");
			}
			i++;
		}

		newrapo = new Rp({
			chain : rapos
		});

		callback && callback.call(newrapo);
		newrapo.type = type.length > 0 ? type.join("_then_"): "#";
		return newrapo;
	};


	$.extend(Rapo, {
		dom : function(type, target){
			var newrapo = Rapo();

			$(target).on(type, function(){
				//console.log(type)
				newrapo.beat();
			})

			newrapo.type = "dom:" + type;
			return newrapo;
		},
		time : function(milliseconds){

			var newrapo = Rapo();

			setInterval(function(){
				newrapo.beat();
			}, milliseconds)

			newrapo.type = "time:" + milliseconds;
			return newrapo;

		},
		OR : function(){
			var rapos = arguments;
			var newrapo = Rapo(), rapotype = [];
			for(var n=0; n<rapos.length; n++){
				rapos[n].active(function(){
					newrapo.beat();
				});
				rapotype.push("[" + rapos[n].type + "]");
			}
			newrapo.type = rapotype.join(" OR ");
			return newrapo;
		},
		AND: function(){
			var rapos = arguments;
			var newrapo = Rapo(),
				mark = [], rapotype = [],
				activeNum = 0;

			for(var n=0; n<rapos.length; n++){
				rapos[n].active((function(index){
					return function(){
						if(!mark[index]){
							mark[index] = true;
							activeNum++;
							if(activeNum >= rapos.length){
								mark = [];
								activeNum = 0;
								newrapo.beat();
							}
						}
					}
				})(n));
				rapotype.push("[" + rapos[n].type + "]");
			}
			newrapo.type = rapotype.join(" AND ");
			return newrapo;
		}
	});

	return Rapo;
})







