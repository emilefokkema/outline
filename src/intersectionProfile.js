define([],function(){
	var intersectionProfile = function(alreadyPresent){
		alreadyPresent = alreadyPresent || [];
		var branches = {
			oneIn : 0,
			oneOut :1,
			twoIn: 2,
			twoOut :3
		};
		var r = {};
		if(alreadyPresent.length == 4){
			r.isSeparable = function(){
				return (alreadyPresent.indexOf(branches.oneIn) + alreadyPresent.indexOf(branches.twoOut)) % 2 ==1;
			};
		}
		for(var p in branches){
			if(branches.hasOwnProperty(p)){
				if(alreadyPresent.indexOf(branches[p]) == -1){
					r[p] = (function(pp){
						return function(){
							return intersectionProfile(alreadyPresent.concat([branches[pp]]));
						};
					})(p);
				}
			}
		}
		return r;
	};
	return intersectionProfile;
});