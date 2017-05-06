define(["rectangleSide","contour"],function(rectangleSide, contour){
	return function(x,y,width,height){
		var sides = [rectangleSide(x,y,width,height)];
		return contour(sides);
	};
});