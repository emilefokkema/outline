define(["intersection","pathSet","combineManyThings"],function(intersection, pathSet,combineManyThings){
	var sideFrom = function(p, toSearch){
		return toSearch.find(function(s){return s.from.equals(p);});
	};

	var sidesFrom = function(p, toSearch){
		return toSearch.filter(function(s){return s.from.equals(p);});
	};




	var getSwitchableSelfIntersections = function(s){
		var newIntersections, intersections = [];
		s.follow(function(s){
			s.follow(function(t){
				if(s!=t && s.next() != t && t.next() != s){
					newIntersections = s.intersectWith(t).map(function(p){
						return intersection(p, s, t);
					}).filter(function(i){
						return !intersections.some(function(j){
							return i.point.equals(j.point);
						});
					});
					intersections = intersections.concat(newIntersections);
				}
			});
		});
		return intersections.filter(function(i){return i.toBeSwitched;});
	};

	var getSwitchableIntersections = function(s1, s2){
		var newIntersections,intersections = [];
		s1.follow(function(s){
			s2.follow(function(t){
				newIntersections = s.intersectWith(t).map(function(p){
					return intersection(p, s, t);
				}).filter(function(i){
					return !intersections.some(function(j){
						return i.point.equals(j.point);
					});
				});
				intersections = intersections.concat(newIntersections);
			});
		});
		return intersections.filter(function(i){return i.toBeSwitched;});
	};

	var switchPairs = function(pairsToSwitch){
		pairsToSwitch.map(function(p){
			p.fromOnePrev.next(p.fromTwo);
			p.fromTwoPrev.next(p.fromOne);
		});
		var resultingPaths = pathSet();
		pairsToSwitch.map(function(p){
			resultingPaths.add(p.fromOne);
			resultingPaths.add(p.fromTwo);
		});
		
		return resultingPaths.paths;
	};

	var addPointsForIntersections = (function(){
		return function(intersections){
			var newOne = intersections[0].one.addPointsOnDifferentSides(intersections.map(function(i){
				return {point:i.point,side:i.one};
			}));
			var newTwo = intersections[0].two.addPointsOnDifferentSides(intersections.map(function(i){
				return {point:i.point,side:i.two};
			}));
			return {
				newOne:newOne,
				newTwo:newTwo
			};
		};
	})();


	var combine = function(s1,s2){
		var s1Original = s1;
		var s2Original = s2;
		s1 = s1.clone();
		s2 = s2.clone();
		if(s1.area() == 0 || s2.area() == 0){
			return [s1Original,s2Original];
		}
		var intersections = getSwitchableIntersections(s1, s2);
		if(intersections.length==0){
			return [s1Original,s2Original];
		}
		var newOnes = addPointsForIntersections(intersections);
		s1 = newOnes.newOne;
		s2 = newOnes.newTwo;
		var pairsToSwitch = intersections.map(function(i){
			var fromOne = sideFrom(i.point, s1);
			var fromTwo = sideFrom(i.point, s2);
			return {
				fromOne:fromOne,
				fromTwo:fromTwo,
				fromOnePrev:fromOne.prev(),
				fromTwoPrev:fromTwo.prev()
			};
		});
		return switchPairs(pairsToSwitch);
	};
	combine.withItself = function(s){
		var sOriginal = s;
		if(!s.isSelfIntersecting()){
			return [sOriginal];
		}
		s = s.clone();
		var intersections = getSwitchableSelfIntersections(s);
		if(intersections.length == 0){
			return [sOriginal];
		}
		addPointsForIntersections(intersections);

		var pairsToSwitch = intersections.map(function(i){
			var froms = sidesFrom(i.point, s);
			var fromOne = froms[0];
			var fromTwo = froms[1];
			return {
				fromOne:fromOne,
				fromTwo:fromTwo,
				fromOnePrev:fromOne.prev(),
				fromTwoPrev:fromTwo.prev()
			};
		});

		return switchPairs(pairsToSwitch);
	};
	combine.many = function(sides){
		return combineManyThings(sides, combine, function(s1,s2){return s1.intersects(s2);});
	};
	return combine;
});