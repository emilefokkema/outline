define([],function(){
	var box = function(minx, maxx, miny, maxy){
		return {
			minx:minx,
			maxx:maxx,
			miny:miny,
			maxy:maxy,
			plus:function(b){
				return box(Math.min(minx, b.minx), Math.max(maxx, b.maxx), Math.min(miny, b.miny), Math.max(maxy, b.maxy));
			},
			toRectangle: function(){
				return rectangle(minx, miny, maxx - minx, maxy - miny);
			},
			expand: function(specs){
				return box(minx - (specs.left || 0), maxx + (specs.right || 0), miny - (specs.top || 0), maxy + (specs.bottom || 0));
			}
		};
	};
	return box;
});