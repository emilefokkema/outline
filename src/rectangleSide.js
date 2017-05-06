define(["side","point"],function(side, point){
	return function(x,y,width,height){
		return side.builder(point(x,y)).to(point(x, y+height)).to(point(x+width,y+height)).to(point(x+width,y)).to(point(x,y)).close();
	};
});