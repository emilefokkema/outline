define([],function(){
	var svgFunctions = {
		angleRoundingBeginPath:function(r){
			return function(firstSide, isCutoffPoint){
				if(typeof isCutoffPoint !=="function"){
					console.log("whoa");
				}
				var p = isCutoffPoint(firstSide.from) ? firstSide.from : firstSide.angleRoundingEnd(r);
				return "M"+p.x+" "+p.y;
			};
		},
		beginPath: function(firstSide){
			return "M"+firstSide.from.x+" "+firstSide.from.y;
		},
		pathStep: function(nextSide, soFar){
			return soFar+" L "+nextSide.to.x+" "+nextSide.to.y;
		},
		angleRoundingPathStep:function(r){
			return function(nextSide, soFar, isCutoffPoint){
				if(isCutoffPoint(nextSide.to)){
					return soFar + " L "+nextSide.to.x+" "+nextSide.to.y;
				}else{
					var p1 = nextSide.angleRoundingBegin(r);
					var p2 = nextSide.next().angleRoundingEnd(r);
					return soFar+" L "+p1.x+" "+p1.y+" Q "+nextSide.to.x+" "+nextSide.to.y+" "+p2.x+" "+p2.y;
				}
			};
		},
		endPath: function(soFar){
			return soFar+" Z";
		}
	};
	return svgFunctions;
});