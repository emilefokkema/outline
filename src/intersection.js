define(["intersectionProfile"],function(intersectionProfile){
	var isSeparable = function(fromOne, toOne, fromTwo, toTwo){
		if(fromOne.sameDirectionAs(fromTwo) || toOne.sameDirectionAs(toTwo)){
			return false;
		}
		var inACircle = [fromOne, toOne, fromTwo, toTwo].sort(function(a,b){return a.angleLeftFromXAxis() - b.angleLeftFromXAxis();});
		var profile = intersectionProfile();
		inACircle.map(function(p){
			if(p == fromOne){
				profile = profile.oneIn();
			}else if(p == toOne){
				profile = profile.oneOut();
			}else if(p == fromTwo){
				profile = profile.twoIn();
			}else if(p == toTwo){
				profile = profile.twoOut();
			}
		});
		
		return profile.isSeparable();
	};
	var isPureIntersection = function(p, s, t){
		return p.isStrictlyBetween(s.from, s.to) && p.isStrictlyBetween(t.from, t.to);
	};

	var simpleIntersection = function(p, s, t){
		return {
			toBeSwitched: true,
			point:p,
			one:s,
			two:t
		};
	};
	
	var f = function(p, s, t){
		var fromOne, toOne, fromTwo, toTwo;
		if(isPureIntersection(p,s,t)){
			return simpleIntersection(p, s, t);
		};
		fromOne = s.lastPointBefore(p).minus(p);
		toOne = s.firstPointAfter(p).minus(p);
		fromTwo = t.lastPointBefore(p).minus(p);
		toTwo = t.firstPointAfter(p).minus(p);
		if(isSeparable(fromOne, toOne, fromTwo, toTwo)){
			return simpleIntersection(p, s, t);
		}
		var fromSplit = !fromOne.sameDirectionAs(fromTwo);
		var toSplit = !toOne.sameDirectionAs(toTwo);
		var toBeSwitched = false;
		if(fromSplit && !toSplit){
			toBeSwitched = fromTwo.angleLeftFrom(toTwo) > fromOne.angleLeftFrom(toTwo);
		}
		if(toSplit && !fromSplit){
			toBeSwitched = toTwo.angleLeftFrom(fromTwo) < toOne.angleLeftFrom(fromTwo);
		}
		return {
			toBeSwitched: toBeSwitched,
			point: p,
			one: s,
			two: t
			
		};
	};
	
	return f;
});