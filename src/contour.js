define(["pathSet","svgFunctions","canvasFunctions", "goAlongPath","intersection","side","combine"],function(pathSet,svgFunctions,canvasFunctions,goAlongPath,intersection,side,combine){
	var combineManyThings = (function(){
		var thingWithCombinationHistory = function(thing, history){

			return {
				thing:thing,
				history:history
			};
		};
		var history = function(indices){
			var isDisjointWith = function(other){
				return indices.some(function(i){return other.indices.indexOf(i) == -1;}) && other.indices.some(function(i){return indices.indexOf(i) == -1});
			};
			var combine = function(other){
				return history(indices.concat(other.indices.filter(function(i){return indices.indexOf(i) == -1;})));
			};
			return {
				indices:indices,
				isDisjointWith:isDisjointWith,
				combine:combine
			};
		};
		var combination = function(thingWithHistory1, thingWithHistory2, combineTwoThings){
			var newThings = combineTwoThings(thingWithHistory1.thing, thingWithHistory2.thing);
			var newHistory = thingWithHistory1.history.combine(thingWithHistory2.history);
			return newThings.map(function(t){
				return thingWithCombinationHistory(t, newHistory);
			});
		};
		var findCombinableThingsWithDisjointHistories = function(allThings, areCombinable){
			for(var i=0;i<allThings.length-1;i++){
				for(var j=i+1;j<allThings.length;j++){
					if(allThings[i].history.isDisjointWith(allThings[j].history) && areCombinable(allThings[i].thing, allThings[j].thing)){
						return [allThings[i], allThings[j]]
					}
				}
			}
			return null;
		};

		var f = function(things, combineTwoThings, areCombinable){
			var newPair, allThings = things.map(function(t,i){return thingWithCombinationHistory(t, history([i]));});
			while(newPair = findCombinableThingsWithDisjointHistories(allThings, areCombinable)){
				allThings.splice(allThings.indexOf(newPair[0]), 1);
					allThings.splice(allThings.indexOf(newPair[1]), 1);
				combination(newPair[0],newPair[1],combineTwoThings).map(function(t){allThings.push(t);});

			}
			var res = allThings.map(function(t){return t.thing;});
			return res;
		};
		f.async = function(things, combineTwoThings, areCombinable, update, done, timeOutWhile){
			var newPair,
				allThings = things.map(function(t,i){return thingWithCombinationHistory(t, history([i]));}),
				numberOfCombinations = this.length * (things.length - 1) / 2,
				combined = 0;
			timeOutWhile(
				function(){return newPair = findCombinableThingsWithDisjointHistories(allThings, areCombinable);}, 
				function(update){
					allThings.splice(allThings.indexOf(newPair[0]), 1);
						allThings.splice(allThings.indexOf(newPair[1]), 1);
					combination(newPair[0],newPair[1],combineTwoThings).map(function(t){allThings.push(t);});
					update(
						allThings.filter(function(t){return t.history.indices.indexOf(0)!=-1;}).length / allThings.length
						);
				}, 5, function(){
					update(1);
					done(allThings.map(function(t){return t.thing;}));
				}, update);
		};
		return f;
	})();

	var combineManyContours = (function(){
		return function(contours){
			return combineManyThings(contours, function(c1,c2){return [c1.combine(c2)];}, function(c1,c2){return c1.intersects(c2);});
		};
	})();

	var combineManyContoursAsync = (function(){
		return function(contours, update, done, timeOutWhile,onCreatedNewContour){
			combineManyThings.async(
				contours,
				function(c1,c2){
					var newOne = c1.combine(c2);
					onCreatedNewContour && onCreatedNewContour(c1,c2,newOne);
					return [newOne];
				},
				function(c1,c2){return c1.intersects(c2);},
				update,
				done,
				timeOutWhile);
		};
	})();

	var holelessPathSet = function(sides, cutoffPoints){
		return {
			sides:sides,
			cutoffPoints:cutoffPoints
		};
	};
	var getMiddles = function(intervals){
		return intervals
			.groupBy(function(a,b){return b[0]<=a[1]&&b[1]>=a[0];})
			.map(function(parts){
				var boundaries = parts.reduce(function(a,b){return a.concat(b);}).sort(function(a,b){return a - b;});
				return (boundaries[0] + boundaries[boundaries.length-1]) / 2;
			});

	};
	var group = function(outerSide, holes){
		var getHolelessPaths = function(){
			if(holes.length == 0){
				return holelessPathSet([outerSide],[]);
			}else{
				var intersectionSet,x,downFrom,downTo,upFrom,upTo,i,box,intersections,verticals,
					affectedSides=[],
					outerSideCopy = outerSide.clone(),
					holesCopy = holes.map(function(h){return h.clone();});

				verticals = getMiddles(holesCopy.map(function(hole){
					box = hole.box();
					return [box.minx, box.maxx];
				}));
				intersectionSet = verticals.map(function(x){
					return outerSideCopy.intersectWithVertical(x)
						.concat(holesCopy.mapMany(function(hole1){
							return hole1.intersectWithVertical(x);
						}))
						.sort(function(a,b){return a.point.y - b.point.y;})
						.filter(function(i){return intersection(i.point, i.side, i.vertical).toBeSwitched;});
				});

				if(intersectionSet.some(function(s){return s.length % 2 != 0;})){
					throw new Error("intersection between contour group and vertical did not result in an even number of intersections");
				}

				intersectionSet.mapMany(function(intersections){return intersections;})
					.groupBy(function(i){return i.side;})
					.map(function(g){
						g.key.addPoints(g.members.map(function(m){return m.point;}));
					});

				intersectionSet.mapMany(function(intersections){return intersections;})
					.map(function(i){
						i.side = i.side.sideFrom(i.point);
					});

				intersectionSet.map(function(intersections){
					for(i=0;i<intersections.length;i+=2){
						downTo = intersections[i].side;
						downFrom = downTo.prev();
						upTo = intersections[i+1].side;
						upFrom = upTo.prev();
						affectedSides.push(downFrom.next(side(downFrom.to, upTo.from)).next(upTo));
						affectedSides.push(upFrom.next(side(upFrom.to, downTo.from)).next(downTo));		
					}
				});

				return holelessPathSet(
					pathSet().addMany(affectedSides).paths,
					intersectionSet.mapMany(function(intersections){return intersections.map(function(i){return i.point;});})
					);

			}
		};
		var area = function(){
			return outerSide.area() + holes.map(function(h){return h.area();}).reduce(function(a,b){return a+b;},0);
		};
		return {
			outerSide:outerSide,
			holes:holes,
			getHolelessPaths:getHolelessPaths,
			area:area,
			box:function(){
				return outerSide.box();
			}
		};
	};
	var isFirstOutsideOf = function(s1,s2,allSides){
		return s1.goesAroundSide(s2) && !allSides.some(function(s){
			var isBetween = s!=s1 && s!=s2 && s1.goesAroundSide(s) && s.goesAroundSide(s2);
			return isBetween; 
		});
	};
	var isOuterSide = function(s, allSides){
		return s.area() > 0 && !allSides.some(function(ss){
			var rightAround = ss!=s && isFirstOutsideOf(ss, s, allSides) && ss.area() > 0;
			
			return rightAround;
		});
	};
	var findHolesForOuterSide = function(outer, allSides){
		return allSides.filter(function(s){
			return s.area() < 0 && isFirstOutsideOf(outer, s, allSides);
		});
	};
	var isHole = function(s, allSides){
		return s.area() < 0 && allSides.some(function(ss){
			return ss!=s && isFirstOutsideOf(ss, s, allSides) && ss.area() > 0;
		});
	};


	var contour = function(sides){

		sides = sides.filter(function(s){return isOuterSide(s, sides) || isHole(s, sides);});
		var groups = sides
			.filter(function(s){return isOuterSide(s,sides);})
			.map(function(outer){return group(outer, findHolesForOuterSide(outer, sides));});
		return {
			rot:function(){
				var args = arguments;
				return contour(sides.map(function(s){return s.rot.apply(s, args);}))
			},
			translate:function(x,y){
				return contour(sides.map(function(s){return s.translate(x,y);}));
			},
			scale:function(r){
				return contour(sides.map(function(s){return s.scale(r);}));
			},
			combine:function(cntr){
				return contour(combine.many(sides.concat(cntr.sides)));
			},
			intersects:function(cntr){
				return sides.some(function(s){return cntr.sides.some(function(ss){return s.intersects(ss);});});
			},
			combineNegative:function(cntr){
				return contour(combine.many(sides.concat(cntr.sides.map(function(s){return s.reverse();}))));
			},
			goAlongPaths:function(beginPath, pathStep, endPath){
				var mapResult = [];
				var mapper = goAlongPath(beginPath, pathStep, endPath);
				for(var i=0;i<sides.length;i++){
					mapResult.push(mapper.apply(null,[sides[i], function(){return false;}]));
				}
				return mapResult;
			},
			goAlongHolelessPaths:function(beginPath, pathStep, endPath){
				var holelessPaths = groups.map(function(g){return g.getHolelessPaths();});
				var mapper = goAlongPath(beginPath, pathStep, endPath);
				return holelessPaths.mapMany(function(hps){
					var mapResult = [];
					var isCutoffPoint = function(p){return hps.cutoffPoints.some(function(pp){return pp.equals(p);});};
					for(var i=0; i<hps.sides.length;i++){
						mapResult.push(mapper.apply(null,[hps.sides[i], isCutoffPoint]));
					}
					return mapResult;
				});
			},
			getHolelessPaths:function(){
				return groups.mapMany(function(g){return g.getHolelessPaths().sides;});
			},
			area:function(){
				return groups.map(function(g){return g.area();}).reduce(function(a,b){return a+b;});
			},
			boxes:function(){
				return groups.map(function(g){return g.box();});
			},
			box:function(){
				return this.boxes().reduce(function(a,b){return a.plus(b);});
			},
			expand:function(d){
				return contour(combine.many(sides.map(function(s){return s.expand(d);})));
			},
			makeCanvasPaths:function(canvasRenderingContext, pathCompleteCallback, roundingRadius){
				if(roundingRadius){
					return this.goAlongPaths(
						canvasFunctions.angleRoundingBeginPath(canvasRenderingContext,roundingRadius),
						canvasFunctions.angleRoundingPathStep(canvasRenderingContext, roundingRadius),
						canvasFunctions.endPath(canvasRenderingContext, pathCompleteCallback)
						);
				}else{
					return this.goAlongPaths(
						canvasFunctions.beginPath(canvasRenderingContext),
						canvasFunctions.pathStep(canvasRenderingContext),
						canvasFunctions.endPath(canvasRenderingContext, pathCompleteCallback)
						);
				}
				
			},
			makeSvgPaths:function(roundingRadius){
				if(roundingRadius){
					return this.goAlongPaths(
						svgFunctions.angleRoundingBeginPath(roundingRadius),
						svgFunctions.angleRoundingPathStep(roundingRadius),
						svgFunctions.endPath
						);
				}else{
					return this.goAlongPaths(
						svgFunctions.beginPath,
						svgFunctions.pathStep,
						svgFunctions.endPath
						);
				}
				
			},
			makeHolelessCanvasPaths:function(canvasRenderingContext, pathCompleteCallback, roundingRadius){
				if(roundingRadius){
					return this.goAlongHolelessPaths(
						canvasFunctions.angleRoundingBeginPath(canvasRenderingContext, roundingRadius),
						canvasFunctions.angleRoundingPathStep(canvasRenderingContext, roundingRadius),
						canvasFunctions.endPath(canvasRenderingContext, pathCompleteCallback)
						);
				}else{
					return this.goAlongHolelessPaths(
						canvasFunctions.beginPath(canvasRenderingContext),
						canvasFunctions.pathStep(canvasRenderingContext),
						canvasFunctions.endPath(canvasRenderingContext, pathCompleteCallback)
						);
				}
				
			},
			makeHolelessSvgPaths: function(roundingRadius){
				if(roundingRadius){
					return this.goAlongHolelessPaths(
						svgFunctions.angleRoundingBeginPath(roundingRadius),
						svgFunctions.angleRoundingPathStep(roundingRadius),
						svgFunctions.endPath
						);
				}else{
					return this.goAlongHolelessPaths(
						svgFunctions.beginPath,
						svgFunctions.pathStep,
						svgFunctions.endPath
						);
				}
				
			},
			sides:sides,
			toString:function(){
				return "["+sides.map(function(s){return s.toString();}).join("|")+"]";
			}
		};
	};
	contour.combineMany = function(contours){
		var contours = combineManyContours(contours);
		return contours[0];
	};
	contour.combineManyAsync = function(contours, update, done, timeOutWhile,onCreatedNewContour){
		combineManyContoursAsync(contours, update, function(_contours){
			done(_contours[0]);
		}, timeOutWhile,onCreatedNewContour);
	};
	return contour;
});