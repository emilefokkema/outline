define([],function(){
	var canvasFunctions = {
		angleRoundingBeginPath: function(ctx,r){
			return function(firstSide, isCutoffPoint){
				ctx.beginPath();
				var p = isCutoffPoint(firstSide.from) ? firstSide.from : firstSide.angleRoundingEnd(r);
				ctx.moveTo(p.x,p.y);
			};
		},
		beginPath : function(ctx){
			return function(firstSide){
				ctx.beginPath();
				ctx.moveTo(firstSide.from.x, firstSide.from.y);
			};
		},
		pathStep: function(ctx){
			return function(nextSide){
				ctx.lineTo(nextSide.to.x, nextSide.to.y);
			};
		},
		angleRoundingPathStep:function(ctx,r){
			return function(nextSide, soFar, isCutoffPoint){
				if(isCutoffPoint(nextSide.to)){
					ctx.lineTo(nextSide.to.x, nextSide.to.y);
				}else{
					var nextnext = nextSide.next();
					ctx.arcTo(nextSide.to.x, nextSide.to.y, nextnext.to.x, nextnext.to.y,r);
				}
			};
		},
		endPath : function(ctx, pathCompleteCallback){
			return function(){
				ctx.closePath();
				pathCompleteCallback && pathCompleteCallback.call(null,[]);
			};
		}
	};
	return canvasFunctions;
});