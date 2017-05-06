define([],function(){
	var pathSet = function(){
		var paths = [];
		var contains = function(s){
			s = s.clone().clean();
			return paths.some(function(t){
				return t.isSameAs(s) || t.overlapsWith(s);
			});
		};
		var add = function(s){
			s = s.clean();
			if(!s){return;}
			if(!contains(s)){
				paths.push(s);
			}
		};
		var addMany = function(ss){
			ss.map(function(s){
				add(s);
			});
		};
		return {
			add:function(s){
				add(s);
				return this;
			},
			addMany:function(ss){
				addMany(ss);
				return this;
			},
			filter:function(condition){
				paths = paths.filter(condition);
			},
			paths:paths,
			contains:contains
		};
	};
	return pathSet;
});