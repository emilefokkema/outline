define([],function(){
	return function(p1,p2,q1,q2){
		return Math.max(p1.x,p2.x) < Math.min(q1.x,q2.x) || Math.max(q1.x,q2.x) < Math.min(p1.x,p2.x)
			|| Math.max(p1.y,p2.y) < Math.min(q1.y,q2.y) || Math.max(q1.y,q2.y) < Math.min(p1.y,p2.y);
	};
});