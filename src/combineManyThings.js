define([],function(){
	var thingWithCombinationHistory = function(thing, history){

		return {
			thing:thing,
			history:history
		};
	};
	var history = function(indices){
		var isDisjointWith = function(other){
			return indices.some(function(i){return other.indices.indexOf(i) == -1;}) && other.indices.some(function(i){return indices.indexOf(i) == -1});
		};
		var combine = function(other){
			return history(indices.concat(other.indices.filter(function(i){return indices.indexOf(i) == -1;})));
		};
		return {
			indices:indices,
			isDisjointWith:isDisjointWith,
			combine:combine
		};
	};
	var combination = function(thingWithHistory1, thingWithHistory2, combineTwoThings){
		var newThings = combineTwoThings(thingWithHistory1.thing, thingWithHistory2.thing);
		var newHistory = thingWithHistory1.history.combine(thingWithHistory2.history);
		return newThings.map(function(t){
			return thingWithCombinationHistory(t, newHistory);
		});
	};
	var findCombinableThingsWithDisjointHistories = function(allThings, areCombinable){
		for(var i=0;i<allThings.length-1;i++){
			for(var j=i+1;j<allThings.length;j++){
				if(allThings[i].history.isDisjointWith(allThings[j].history) && areCombinable(allThings[i].thing, allThings[j].thing)){
					return [allThings[i], allThings[j]]
				}
			}
		}
		return null;
	};

	var f = function(things, combineTwoThings, areCombinable){
		var newPair, allThings = things.map(function(t,i){return thingWithCombinationHistory(t, history([i]));});
		while(newPair = findCombinableThingsWithDisjointHistories(allThings, areCombinable)){
			allThings.splice(allThings.indexOf(newPair[0]), 1);
				allThings.splice(allThings.indexOf(newPair[1]), 1);
			combination(newPair[0],newPair[1],combineTwoThings).map(function(t){allThings.push(t);});

		}
		var res = allThings.map(function(t){return t.thing;});
		return res;
	};
	f.async = function(things, combineTwoThings, areCombinable, update, done, timeOutWhile){
		var newPair,
			allThings = things.map(function(t,i){return thingWithCombinationHistory(t, history([i]));}),
			numberOfCombinations = this.length * (things.length - 1) / 2,
			combined = 0;
		timeOutWhile(
			function(){return newPair = findCombinableThingsWithDisjointHistories(allThings, areCombinable);}, 
			function(update){
				allThings.splice(allThings.indexOf(newPair[0]), 1);
					allThings.splice(allThings.indexOf(newPair[1]), 1);
				combination(newPair[0],newPair[1],combineTwoThings).map(function(t){allThings.push(t);});
				update(
					allThings.filter(function(t){return t.history.indices.indexOf(0)!=-1;}).length / allThings.length
					);
			}, 5, function(){
				update(1);
				done(allThings.map(function(t){return t.thing;}));
			}, update);
	};
	return f;
});