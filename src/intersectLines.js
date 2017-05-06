define([],function(){
	var intersectLines = function(p1,p2,q1,q2){
		var x1 = p2.minus(p1);
		var x2 = q2.minus(q1);
		var cross = x2.cross(x1);
		if(cross == 0){
			return null;
		}
		var st = q1.minus(p1).matrix(-x2.y, x2.x, -x1.y, x1.x).scaleInv(cross);
		return p1.plus(p2.minus(p1).scale(st.x));
	};
	return intersectLines;
});