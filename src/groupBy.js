define([],function(){
	Array.prototype.groupBy = (function(){
		var group = function(key,firstMember){
			var members = [firstMember];
			return {
				key:key,
				members:members,
				add:function(o){members.push(o);}
			};
		};
		var findMemberForGroup = function(current, candidates, eq){
			var result;
			for(var i=0;i<candidates.length;i++){
				if(
					current.indexOf(candidates[i]) == -1 && 
					(
						current.some(function(c){return eq(c,candidates[i]);}) ||
						current.length == 0
					)
				){
					return candidates[i];
				}
			}
		};
		return function(keyF, keyEquals){
			if(arguments.length == 1 && arguments[0].length == 2){
				return (function(self,eq){
					var match,groups = [[]];
					while(self.length > 0){
						match = findMemberForGroup(groups[groups.length - 1], self, eq);
						if(match){
							groups[groups.length - 1].push(match);
						}else{
							match = self[0];
							groups.push([match]);
						}
						self.splice(self.indexOf(match),1);
					}
					return groups;
				})(this.map(function(x){return x;}), arguments[0]);
			}
			keyEquals = keyEquals || function(a,b){return a==b;};
			var newKey,thisKey,groups = [];
			for(var i=0;i<this.length;i++){
				thisKey = keyF(this[i]);
				newKey = true;
				for(var j=0;j<groups.length;j++){
					if(keyEquals(groups[j].key, thisKey)){
						newKey = false;
						groups[j].add(this[i]);
						break;
					}
				}
				if(newKey){
					groups.push(group(thisKey, this[i]));
				}
			}
			return groups.map(function(g){return {key:g.key,members:g.members};});
		};
	})();
});