define(["segmentsAreFarApart","point"],function(segmentsAreFarApart, point){
	return function(p1,p2,q1,q2){
		if(segmentsAreFarApart(p1,p2,q1,q2)){
			return []
		}
		var x1 = p2.minus(p1);
		var x2 = q2.minus(q1);
		var cross = x2.cross(x1);
		var res=[];
		if(cross==0){
			if(p1.minus(q1).cross(x1)==0){
				
				if(p1.isBetween(q1,q2) && res.indexOf(p1)==-1){
					res.push(p1);
				}
				if(p2.isBetween(q1,q2) && res.indexOf(p2)==-1){
					res.push(p2);
				}
				if(q1.isBetween(p1,p2) && res.indexOf(q1)==-1){
					res.push(q1);
				}
				if(q2.isBetween(p1,p2) && res.indexOf(q2)==-1){
					res.push(q2);
				}
				
			}
		}else if(x1.x == 0 && x2.y == 0){
			if((q1.x - p1.x) * (q2.x - p1.x) <= 0 && (p2.y - q1.y)*(p1.y - q1.y) <= 0){
				res = [point(p1.x,q1.y)];
			}
		}else if(x2.x == 0 && x1.y == 0){
			if((p1.x - q1.x) * (p2.x - q1.x) <= 0 && (q2.y - p1.y)*(q1.y - p1.y) <= 0){
				res = [point(q1.x,p1.y)];
			}
		}else{
			var st = q1.minus(p1).matrix(-x2.y, x2.x, -x1.y, x1.x).scaleInv(cross);
			if(st.x>1||st.y>1||st.x<0||st.y<0){
				//return [];
			}else{
				res = [p1.plus(p2.minus(p1).scale(st.x))];
			}
		}
		return res;
	};
});