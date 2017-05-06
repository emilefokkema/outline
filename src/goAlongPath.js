define([],function(){
	var goAlongPath = function(beginPath, pathStep, endPath){
		return function(s, context){
			var soFar,index = 0;
			s.follow(function(ss){
				if(index == 0){
					soFar = beginPath.apply(null,[ss, context]);
				}
				soFar = pathStep.apply(null,[ss,soFar, context]);
				index++;
			});
			return endPath.apply(null,[soFar, context]);
		};
	};
	return goAlongPath;
});