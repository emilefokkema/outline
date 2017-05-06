define(["floatPattern"],function(floatPattern){
	var point = function(x,y){
		return {
			minus:function(p){return point(x-p.x,y-p.y);},
			plus:function(p){return point(x+p.x,y+p.y);},
			cross:function(p){return x*p.y - y*p.x;},
			scale:function(r){
				return point(r*x, r*y);
			},
			scaleInv:function(r){
				return point(x/r, y/r);
			},
			isImproperlyPlaced:function(){
				return Math.floor(x * 1000) / 1000 != x || Math.floor(y * 1000) / 1000 != y;
			},
			matrix:function(a,b,c,d){return point(a*x+b*y,c*x+d*y);},
			mod:function(){return Math.sqrt(Math.pow(x,2)+Math.pow(y,2));},
			dot:function(p){return x*p.x+y*p.y;},
			rot:function(){
				if(arguments.length == 1){
					var alpha = arguments[0];
					return point(x*Math.cos(alpha)-y*Math.sin(alpha), y*Math.cos(alpha)+x*Math.sin(alpha));
				}else{
					var tr = point(arguments[1], arguments[2]);
					return this.minus(tr).rot(arguments[0]).plus(tr);
				}
			},
			projectOn:function(p){
				return p.scale(this.dot(p)/p.mod());
			},
			unit:function(){
				return this.scaleInv(this.mod());
			},
			angleLeftFromXAxis:function(){
				if(x==0){
					if(y==0){
						return Infinity;
					}else if(y > 0){
						return Math.PI/2;
					}else if(y < 0){
						return 3*Math.PI/2;
					}
				}else if(x < 0){
					return Math.PI + Math.atan(y/x);
				}else if(x > 0){
					return Math.atan(y/x) + (y < 0 ? 2*Math.PI : 0);
				}
			},
			angleLeftFrom:function(p){
				var xPart = this.projectOn(p);
				var yPart = this.minus(xPart);
				var xSign = this.dot(p) >= 0 ? 1 : -1;
				var ySign = this.cross(p) < 0 ? 1 : -1;
				return point(xPart.mod() * xSign, yPart.mod() * ySign).angleLeftFromXAxis();
			},
			x:x,
			y:y,
			equals:function(p){
				return this == p || this.minus(p).mod()==0;
			},
			toString:function(){return "("+x+","+y+")";},
			isBetween: function(p1,p2){
				return this.minus(p1).dot(this.minus(p2)) <= 0;
			},
			isStrictlyBetween:function(p1,p2){
				return !this.equals(p1) && !this.equals(p2) && this.isBetween(p1,p2);
			},
			sameDirectionAs:function(p){
				return this.cross(p) == 0 && this.dot(p) > 0;
			},
			distanceFromSegment:function(p1,p2){
				var segment = p2.minus(p1);
				if(this.minus(p1).dot(segment) * this.minus(p2).dot(segment) > 0){
					return Math.min(this.minus(p1).mod(), this.minus(p2).mod());
				}else{
					var projectionOnSegment = this.projectOn(segment);
					return this.minus(projectionOnSegment).mod();
				}
			}
		};
	};
	point.fromString = function(s){
		var rgx = new RegExp("\\(("+floatPattern+"),("+floatPattern+")\\)");
		var match = s.match(rgx);
		return point(parseFloat(match[1]),parseFloat(match[2]));
	};
	return point;
});