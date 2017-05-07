define([],function(){

	return function(logError, logSuccess){
		var getTest = function(logError, logSuccess){
			return function(name,t){
				var failed = false;
				try{
					t.apply({
						assert:function(bool, message){
							if(!bool){
								failed = true;
								logError("["+name+"] "+message);
							}
						},
						expect:function(actual){
							return {
								toBe:function(expected, message){
									if(actual != expected){
										failed = true;
										logError("["+name+"] "+(message||"")+" (expected "+expected+" but saw "+actual+")");
									}
								}
							};
						}
					},[]);
					if(!failed){
						logSuccess("[" + name + "] passed");
					}
				}
				catch(e){
					logError("["+name+"] "+e.message);
				}
				
			};
		};

		var testSet = function(name, doThem){
			var failed = false;
			var errors = [], successes = [];
			doThem(getTest(function(e){
				failed = true;
				errors.push(e);
			}, function(s){
				successes.push(s);
			}));
			if(!failed){
				logSuccess("["+name+"] passed");
			}else{
				errors.map(logError);
				successes.map(logSuccess);
			}
		};

		return testSet;
	};
});