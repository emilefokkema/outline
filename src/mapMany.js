define([],function(){
	Array.prototype.mapMany = function(getArray){
		var res = [];
		this.map(function(el,i){
			res = res.concat(getArray.apply(null,[el,i]));
		});
		return res;
	};
});