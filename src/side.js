define(["combine","point","intersectSegments","box","goAlongPath","svgFunctions","intersectLines","sign"],function(combine,point,intersectSegments,box,goAlongPath,svgFunctions,intersectLines,sign){
	var sideBuilder = function(from, side_){
		var to;
		if(!side_){
			to = function(p){
				return sideBuilder(p, side(from, p))
			};
		}else{
			to = function(p){
				return sideBuilder(p, side_.next(side(from, p)))
			}
		}
		return {
			to:to,
			close:function(){
				return side_.close().next();
			}
		};
	};
	var side = function(p1,p2){
		var ret,prev,next;
		var follow = function(callback){
			var had=[];
			var notBroken = true;
			for(var s=ret;s&&had.indexOf(s)==-1&&notBroken;s=s.next()){
				callback(s, function(){notBroken=false;});
				had.push(s);
			}
		};
		var filter = function(cond){
			var toKeep = [];
			follow(function(s){
				if(cond.apply(null,[s])){
					toKeep.push(s);
				}
			});
			return toKeep;
		};
		var change = function(newPoint){
			var builder = sideBuilder(newPoint(ret.from));
			follow(function(s){
				builder = builder.to(newPoint(s.to));
			});
			return builder.close();
		};
		var hasZeroLength = function(s){return s.to.equals(s.from);};
		var isNotStraightContinuation = function(s){return s.to.minus(s.from).cross(s.prev().to.minus(s.prev().from)) != 0;};
		ret= {
			string:p1.toString()+"-->"+p2.toString(),
			from:p1,
			to:p2,
			next:function(s, notBack){
				if(!s){
					return next;
				}
				next = s;
				if(!notBack){
					s.prev(this,true);
				}
				return s;
			},
			prev:function(s, notBack){
				if(!s){
					return prev;
				}
				prev = s;
				if(!notBack){
					s.next(this,true);
				}
				return s;
			},
			addPoint:function(p){
				if(p.equals(this.from)){

					return next;
				}else if(p.equals(this.to)){
					return next.next();
				}else{
					var newSide = side(this.from, p).next(side(p,this.to)).next(next);
					prev.next(newSide.prev().prev());
					return newSide;
				}
				
			},
			filter:filter,
			eliminate:function(){
				prev.next(next);
			},
			expand:(function(){
				var makeLine = function(s, d){
					var out = s.to.minus(s.from).rot(Math.PI/2).unit().scale(d);
					return {
						p1: s.from.plus(out),
						p2: s.to.plus(out),
						equals:function(l){
							return l.p1.equals(this.p1) && l.p2.equals(this.p2);
						}
					};
				};
				return function(d){
					var line,nextLine,firstLine,builder,points=[],self=this;
					follow(function(s){
						if(points.length == 0){
							firstLine = makeLine(s,d);
							line = firstLine;
						}else{
							line = nextLine;
						}
						nextLine = makeLine(s.next(), d);
						points.push(intersectLines(line.p1, line.p2, nextLine.p1, nextLine.p2));
					});
					builder = sideBuilder(points[0]);
					for(var i=1;i<points.length;i++){
						builder = builder.to(points[i]);
					}
					return combine.withItself(builder.to(points[0]).close()).filter(function(s){return s.sign() == self.sign();})[0];
				};
			})(),
			extend:function(){
				var newNext = next.find(isNotStraightContinuation);
				if(newNext != next){
					newNext = prev.next(side(this.from, newNext.from)).next(newNext);
				}
				return newNext;
			},
			clean:function(){
				var thisClone = this.clone();
				var toKeep = thisClone.find(function(s){return !hasZeroLength(s);});
				var haveZeroLength = thisClone.filter(hasZeroLength);
				haveZeroLength.map(function(s){s.eliminate();});
				var areNotStraightContinuation = toKeep.filter(isNotStraightContinuation);
				var current = toKeep;
				for(var i=0;i<areNotStraightContinuation.length;i++){
					current = areNotStraightContinuation[i].extend();
				}
				return current;
			},
			addPoints:function(arr){
				arr.sort(function(a,b){return a.minus(ret.from).mod() - b.minus(ret.from).mod();});
				var currentPart = this;
				arr.map(function(p){
					currentPart = currentPart.addPoint(p).prev();
				});
				return currentPart;
			},
			addPointsOnDifferentSides:function(arr){ //[{point:..., side: ...}, ...]
				var current = ret;
				var grouped = arr.groupBy(function(p){return p.side;});
				for(var i=0;i<grouped.length;i++){
					current = grouped[i].key.addPoints(grouped[i].members.map(function(m){return m.point;}));
				}
				return current;
			},
			intersectWithVertical:function(x){
				var box = this.box();
				var segment = side(point(x,box.miny - 1),point(x, box.maxy + 1));
				var intersections = [];
				follow(function(s){
					intersections = intersections.concat(s.intersectWith(segment).map(function(p){return {side:s,point:p,vertical:segment};}));
				});
				var result = intersections.length > 0 ? intersections
					.groupBy(function(a,b){return a.point.equals(b.point);})
					.map(function(g){return g[0];}) : intersections;
				return result;

			},
			close:function(){
				var beginning = this;
				while(beginning.prev()){
					beginning = beginning.prev();
				}
				beginning.prev(this);
				return this;
			},
			toString:function(){return "from "+this.from.toString()+" to "+this.to.toString();},
			follow:follow,
			translate:function(x,y){
				var by = point(x,y);
				return change(function(p){
					return p.plus(by);
				});
			},
			scale:function(r){
				return change(function(p){return p.scale(r);});
			},
			rot:function(){
				var args = arguments;
				return change(function(p){return p.rot.apply(p, args);});
			},
			clone:function(){
				return change(function(p){return p;});
			},
			intersectWith:function(s){
				return intersectSegments(this.from, this.to, s.from, s.to);
			},
			isSameAs:function(other){
				var result = false;
				follow(function(s){
					if(s==other){
						result = true;
					}
				});
				return result;
			},
			findSmallest:function(quant){
				var res,newQuant,currentQuant;
				follow(function(s){
					newQuant = quant.apply(null,[s]);
					if(!currentQuant){
						currentQuant = newQuant;
						res = s;
					}else{
						if(newQuant <= currentQuant){
							currentQuant = newQuant;
							res = s;
						}
					}
				});
				return res;
			},
			angleRoundingEnd:function(r){
				var x = this.to.minus(this.from);
				var angle = x.angleLeftFrom(prev.from.minus(this.from));
				if(angle > Math.PI){
					angle = 2*Math.PI - angle;
				}
				var d = r/Math.tan(angle/2);
				return this.from.plus(x.scale(d/x.mod()));
			},
			angleRoundingBegin:function(r){
				var x = this.from.minus(this.to);
				var angle = x.angleLeftFrom(next.to.minus(this.to));
				if(angle > Math.PI){
					angle = 2*Math.PI - angle;
				}
				var d = r/Math.tan(angle/2);
				return this.to.plus(x.scale(d/x.mod()));
			},
			box:function(){
				var minx=null,maxx=null,miny=null,maxy=null;
				var compare = function(cand, cond, curr){
					return curr == null ? cand : (cond(cand,curr) ? cand : curr);
				};
				follow(function(s){
					minx = compare(s.from.x, function(cand,curr){return cand <= curr;}, minx);
					maxx = compare(s.from.x, function(cand,curr){return cand >= curr;}, maxx);
					miny = compare(s.from.y, function(cand,curr){return cand <= curr;}, miny);
					maxy = compare(s.from.y, function(cand,curr){return cand >= curr;}, maxy);
				});
				return box(minx, maxx, miny, maxy);
			},
			find:function(condition){
				var res = null;
				follow(function(s, stop){
					if(condition(s)){
						res = s;
						stop();
					}
				});
				return res;
			},
			every:function(condition){
				return !this.find(function(s){return !condition(s);});
			},
			contains:function(condition){
				return this.find(condition) != null;
			},
			sideFrom:function(p){
				return this.find(function(s){return s.from.equals(p);});
			},
			area:function(){
				var a = 0;
				follow(function(s){
					a += (s.to.x - s.from.x)*(s.from.y + s.to.y)/2
				});
				return a;
			},
			sign:function(){
				return this.area() >= 0 ? sign.POSITIVE : sign.NEGATIVE;
			},
			goesAround:function(p){
				if(this.containsPoint(p)){
					return false;
				}
				var x1,x2,dangle,angle = 0;
				follow(function(s){
					x1 = s.from.minus(p);
					x2 = s.to.minus(p);
					dangle = Math.asin(Math.min(1, Math.max(x1.cross(x2)/(x1.mod()*x2.mod()), -1)));
					if(x1.dot(x2) < 0){
						if(dangle > 0){
							dangle = Math.PI - dangle;
						}else{
							dangle = -Math.PI - dangle;
						}
					}
					angle += dangle;
				});
				return Math.abs(angle) > 0.01;
			},
			containsSegment: function(p1,p2){
				return this.contains(function(s){return s.sideContainsPoint(p1) && s.sideContainsPoint(p2);});
			},
			takeShortCutFromTo: function(p1,p2){
				var clone = this.clone()
					.find(function(s){return s.sideContainsPoint(p1);})
					.addPoint(p1)
					.find(function(s){return s.sideContainsPoint(p2);})
					.addPoint(p2);
				var beforeP1 = clone.sideFrom(p1).prev();
				var afterP2 = clone.sideFrom(p2);
				return beforeP1.next(side(p1,p2)).next(afterP2);
			},
			goesAroundSegment: function(p1,p2){
				if(this.containsPoint(p1)){
					if(this.containsPoint(p2)){
						var thisArea = this.area();
						var shortCut1 = this.takeShortCutFromTo(p1,p2);
						var shortCut2 = this.takeShortCutFromTo(p2,p1);
						return shortCut1.area() < thisArea && shortCut2.area() < thisArea;
					}
					return this.goesAround(p2);
				}
				if(this.containsPoint(p2)){
					return this.goesAround(p1);
				}
				return this.goesAround(p1) && this.goesAround(p2);
				
			},
			goesAroundSide:function(other){
				return other.every(function(s){
					return ret.containsSegment(s.from, s.to) || ret.goesAroundSegment(s.from, s.to);
				});
				
			},
			overlapsWith:function(other){
				var res=true;
				follow(function(s){
					if(!other.find(function(t){return t.from.equals(s.from) && t.to.equals(s.to);})){
						res = false;
					}
				});
				other.follow(function(s){
					if(!ret.find(function(t){return t.from.equals(s.from) && t.to.equals(s.to);})){
						res = false;
					}
				});
				return res;
			},
			containsPoint:function(p){
				return this.contains(function(s){return s.sideContainsPoint(p);});
			},
			toString:function(){
				var s=this.from.toString();
				follow(function(ss){
					s += "-->"+ss.to.toString();
				});
				return s;
			},
			sideContainsPoint:function(p){
				return this.from.equals(p) || this.to.equals(p) || (this.from.minus(p).cross(this.to.minus(p)) == 0 && p.isBetween(this.from, this.to));
			},
			reverse:function(){
				var last,snext,res,from = this.from,to = this.to;
				follow(function(s){
					if(!res){
						last = side(s.to, s.from);
						res = last;
					}else{
						res = res.prev(side(s.to, s.from));
					}
				});
				return res.prev(last);
			},
			length:function(){
				var n=0;
				follow(function(){n++;})
				return n;
			},
			isSelfIntersecting:function(){
				var res = false;
				follow(function(s, stop1){
					follow(function(t, stop2){
						if(s!=t && s.intersectWith(t).length > 0 && s.next() != t && t.next() != s){
							res = true;
							stop2();
							stop1();
						}
					});
				});
				return res;
			},
			intersects:function(other){
				var res = false;
				follow(function(s,stop1){
					other.follow(function(t,stop2){
						if(s.intersectWith(t).length > 0){
							res = true;
							stop2();
							stop1();
						}
					});
				});
				return res;
			},
			lastPointBefore:function(p){
				return this.reverse().firstPointAfter(p);
			},
			firstPointAfter:function(p){
				var found = this.find(function(s){
					return !s.to.equals(p);
				});
				return found.to;
			},
			toSvgPath:function(){
				return goAlongPath(svgFunctions.beginPath,
							svgFunctions.pathStep,
							svgFunctions.endPath)(this);

			}

		};
		return ret;
	};
	side.fromString = function(s){
		var match = s.match(/\([^)]+\)/g);
		var builder;
		for(var i=0;i<match.length;i++){
			if(i==0){
				builder = sideBuilder(point.fromString(match[i]));
			}else{
				builder = builder.to(point.fromString(match[i]));
			}
		}
		return builder.close();
	};
	side.builder = sideBuilder;
	return side;
})