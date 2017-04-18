(function(){
	window.outlineTest = function(side, contour, combine, rectangleSide, intersectSegments, sideBuilder, rectangle, combineMany, point){
		window.outlineTest = function(logError, logSuccess){
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

			testSet("cleanTests",function(test){
				test("clean",function(){
					var a = rectangleSide(0,0,10,10);
					a.addPoint(point(5,0)).addPoint(point(0,5)).addPoint(point(0,10));
					this.expect(a.area()).toBe(100);
					a = a.clean();
					this.expect(a.area()).toBe(100,"area changed after adding points and cleaning");
				});
				test("clean2",function(){
					var s = side.fromString("(8,0)-->(0,0)-->(0,10)-->(8,10)-->(10,10)-->(10,0)-->(8,0)");
					s = s.clean();
					this.expect(s.length()).toBe(4);
				});
			});

			testSet("intersectWithSelfTests",function(test){
				test("intersectWithSelfSomethingChangesTest", function(){
					var s = sideBuilder(point(0,0)).to(point(0,10)).to(point(10,10)).to(point(20,10)).to(point(20,20)).to(point(10,20)).to(point(10,0)).to(point(0,0)).close();
					var res = combine.withItself(s);

					this.expect(res.length).toBe(2);
				});
				test("intersectWithSelfNothingChangesTest",function(){
					var s = rectangleSide(0,0,10,10);
					var res = combine.withItself(s);

					this.expect(res.length).toBe(1);
				});
			});

			testSet("svgTests",function(test){
				test("svgTest",function(){
					var c = rectangle(0,0,3,3).combineNegative(rectangle(1,1,1,1)).scale(10);
					var svgPaths = c.makeSvgPaths();
					this.expect(svgPaths[0]).toBe("M0 0 L 0 30 L 30 30 L 30 0 L 0 0 Z");
					this.expect(svgPaths[1]).toBe("M10 20 L 10 10 L 20 10 L 20 20 L 10 20 Z");
					svgPaths = c.makeHolelessSvgPaths();
					this.expect(svgPaths[0]).toBe("M15 10 L 20 10 L 20 20 L 15 20 L 15 30 L 30 30 L 30 0 L 15 0 L 15 10 Z");
					this.expect(svgPaths[1]).toBe("M15 0 L 0 0 L 0 30 L 15 30 L 15 20 L 10 20 L 10 10 L 15 10 L 15 0 Z");
					svgPaths = c.makeSvgPaths(1);
					this.expect(svgPaths[0]).toBe("M0 1.0000000000000002 L 0 29 Q 0 30 1.0000000000000002 30 L 29 30 Q 30 30 30 29 L 30 1.0000000000000002 Q 30 0 29 0 L 1.0000000000000002 0 Q 0 0 0 1.0000000000000002 Z");
					this.expect(svgPaths[1]).toBe("M10 19 L 10 11 Q 10 10 11 10 L 19 10 Q 20 10 20 11 L 20 19 Q 20 20 19 20 L 11 20 Q 10 20 10 19 Z");
					svgPaths = c.makeHolelessSvgPaths(1);
					this.expect(svgPaths[0]).toBe("M15 10 L 19 10 Q 20 10 20 11 L 20 19 Q 20 20 19 20 L 15 20 L 15 30 L 29 30 Q 30 30 30 29 L 30 1.0000000000000002 Q 30 0 29 0 L 15 0 L 15 10 Z");
					this.expect(svgPaths[1]).toBe("M15 0 L 1.0000000000000002 0 Q 0 0 0 1.0000000000000002 L 0 29 Q 0 30 1.0000000000000002 30 L 15 30 L 15 20 L 11 20 Q 10 20 10 19 L 10 11 Q 10 10 11 10 L 15 10 L 15 0 Z");
				});
				test("svgTest2",function(){
					var s = side.fromString("(8,0)-->(0,0)-->(0,10)-->(8,10)-->(10,10)-->(10,0)-->(8,0)");
					var svg = s.toSvgPath();
					this.expect(svg).toBe("M8 0 L 0 0 L 0 10 L 8 10 L 10 10 L 10 0 L 8 0 Z");
				});
			});

			testSet("expandTests",function(test){
				test("expandPositiveTest",function(){
					var s = rectangleSide(0,0,10,10);
					var sExp = s.expand(2);
					this.expect(sExp.area()).toBe(14*14);
				});
				test("expandNegativeTest",function(){
					var s = rectangleSide(0,0,10,10);
					var sExp = s.expand(-2);
					this.expect(sExp.area()).toBe(6*6);
				});
				test("expandCombinationTest",function(){
					var c = rectangle(0,0,10,10).combineNegative(rectangle(1,1,8,8));
					var cExp = c.expand(1);

					this.expect(cExp.area()).toBe(12*12 - 6*6);
				});
			});

			testSet("goesAroundTests",function(test){
				test("goesAroundSideTest",function(){
					var big = side.fromString("(14,6)-->(13.25,6)-->(13.25,4)-->(13,4)-->(13,8.25)-->(14.25,8.25)-->(14.25,8)-->(13.25,8)-->(13.25,6.25)-->(15.25,6.25)-->(15.25,5.25)-->(16,5.25)-->(16,12)-->(0.25,12)-->(0.25,11.25)-->(5.25,11.25)-->(5.25,10.25)-->(6.25,10.25)-->(6.25,10)-->(5.25,10)-->(5.25,6.25)-->(6,6.25)-->(6,9.25)-->(7,9.25)-->(7,11)-->(6,11)-->(6,11.25)-->(7.25,11.25)-->(7.25,9)-->(6.25,9)-->(6.25,6.25)-->(7.25,6.25)-->(7.25,6)-->(5,6)-->(5,11)-->(0.25,11)-->(0.25,0.25)-->(4,0.25)-->(4,1.25)-->(4.25,1.25)-->(4.25,0.25)-->(5,0.25)-->(5,4)-->(3,4)-->(3,8)-->(2.25,8)-->(2.25,1.25)-->(3,1.25)-->(3,2.25)-->(4,2.25)-->(4,3)-->(3,3)-->(3,3.25)-->(4.25,3.25)-->(4.25,2)-->(3.25,2)-->(3.25,1)-->(1,1)-->(1,1.25)-->(2,1.25)-->(2,8.25)-->(3.25,8.25)-->(3.25,4.25)-->(5.25,4.25)-->(5.25,0.25)-->(11,0.25)-->(11,8)-->(10,8)-->(10,8.25)-->(11,8.25)-->(11,9)-->(9.25,9)-->(9.25,1.25)-->(10,1.25)-->(10,7.25)-->(10.25,7.25)-->(10.25,1)-->(7,1)-->(7,1.25)-->(9,1.25)-->(9,9.25)-->(11.25,9.25)-->(11.25,0.25)-->(16,0.25)-->(16,2)-->(15.25,2)-->(15.25,1)-->(15,1)-->(15,2.25)-->(16,2.25)-->(16,5)-->(15,5)-->(15,6)-->(14.25,6)-->(14.25,4.25)-->(15.25,4.25)-->(15.25,3)-->(14.25,3)-->(14.25,1)-->(12,1)-->(12,10)-->(8.25,10)-->(8.25,2)-->(6.25,2)-->(6.25,1)-->(6,1)-->(6,5)-->(4,5)-->(4,9)-->(1.25,9)-->(1.25,2)-->(1,2)-->(1,10.25)-->(4.25,10.25)-->(4.25,10)-->(1.25,10)-->(1.25,9.25)-->(4.25,9.25)-->(4.25,5.25)-->(7.25,5.25)-->(7.25,3)-->(7,3)-->(7,5)-->(6.25,5)-->(6.25,2.25)-->(8,2.25)-->(8,7)-->(7,7)-->(7,8.25)-->(7.25,8.25)-->(7.25,7.25)-->(8,7.25)-->(8,11.25)-->(15.25,11.25)-->(15.25,7)-->(14,7)-->(14,7.25)-->(15,7.25)-->(15,9)-->(13,9)-->(13,9.25)-->(15,9.25)-->(15,11)-->(8.25,11)-->(8.25,10.25)-->(14.25,10.25)-->(14.25,10)-->(12.25,10)-->(12.25,3.25)-->(13.25,3.25)-->(13.25,3)-->(12.25,3)-->(12.25,1.25)-->(14,1.25)-->(14,2)-->(13,2)-->(13,2.25)-->(14,2.25)-->(14,3.25)-->(15,3.25)-->(15,4)-->(14,4)-->(14,6)");
					var small = side.fromString("(14,6)-->(14,6.25)-->(14.25,6.25)-->(14.25,6)-->(14,6)");
					this.assert(!big.goesAroundSide(small), "big one should not go around small one");
				});
				test("goesAroundSideTest2",function(){
					var big = side.fromString("(4,1)-->(4,0)-->(0,0)-->(0,3)-->(4,3)-->(4,2)-->(1,2)-->(1,1)-->(4,1)")
					var small = side.fromString("(2,1)-->(2,2)-->(3,2)-->(3,1)-->(2,1)")
					this.assert(!big.goesAroundSide(small), "big one should not go around small one");
				});
				test("goesAroundSideTest3",function(){
					var big = side.fromString("(4,1)-->(4,0)-->(0,0)-->(0,3)-->(4,3)-->(4,2)-->(1,2)-->(1,1)-->(4,1)")
					var small = side.fromString("(1,1)-->(1,2)-->(2,2)-->(2,1)-->(1,1)")
					this.assert(!big.goesAroundSide(small), "big one should not go around small one");
				});
				test("containsSegmentTest",function(){
					var s = side.fromString("(4,1)-->(4,0)-->(0,0)-->(0,3)-->(4,3)-->(4,2)-->(1,2)-->(1,1)-->(4,1)");
					this.assert(s.containsSegment(point(0,1), point(0,2)));
					this.assert(!s.containsSegment(point(2,1), point(2,2)));
				});
				test("goesAroundSegmentTest",function(){
					var s = side.fromString("(4,1)-->(4,0)-->(0,0)-->(0,3)-->(4,3)-->(4,2)-->(1,2)-->(1,1)-->(4,1)");
					this.assert(!s.goesAroundSegment(point(2,1), point(2,2)));
					this.assert(s.goesAroundSegment(point(2,0), point(2,1)));
				});
			});

			testSet("combineTests",function(test){
				test("negative combine 1",function(){
					var a = rectangleSide(0,0,10,10);
					var b = rectangleSide(0,0,10,5).reverse();
					var c = contour(combine(a,b)).sides;
					this.expect(c.length).toBe(1, "expected 1 path");
					this.expect(c[0].length()).toBe(4, "expected 4 sides");
					this.expect(c[0].area()).toBe(50, "expected area 50");
				});
				test("negative combine 2",function(){
					var a = rectangleSide(0,0,10,10);
					var b = rectangleSide(0,0,8,5).reverse();
					var c = contour(combine(a,b)).sides;
					this.expect(c.length).toBe(1, "expected 1 path");
					this.expect(c[0].length()).toBe(6, "expected 6 sides");
					this.expect(c[0].area()).toBe(60, "expected area 60");
				});
				test("combineMany",function(){
					var c = combineMany([
						rectangleSide(0,0,10,10),
						rectangleSide(7,7,10,10),
						rectangleSide(14,14,10,10),
						rectangleSide(21,21,10,10)
					]);
					var areas = c.map(function(s){return s.area();});
					this.expect(c.length).toBe(4, "expected 4 resulting sides");
					this.assert(areas.indexOf(373) != -1, "expected an area of 373");
				});
				test("positiveCombineToMakeHole",function(){
					var rect1 = rectangle(0,0,10,2);
					var rect2 = rectangle(0,0,2,10);
					var rect3 = rectangle(0,8,10,2);
					var rect4 = rectangle(8,0,2,10);
					var c = rect1;
					this.expect(c.area()).toBe(20,"the area isn't even right in step 1");
					c = c.combine(rect2);
					this.expect(c.area()).toBe(36,"area is wrong in step 2");
					c = c.combine(rect3);
					this.expect(c.area()).toBe(52,"area is wrong in step 3");
					c = c.combine(rect4);
					this.expect(c.area()).toBe(64,"area is wrong in step 4");
				});
				test("positiveCombineToMakeHole2",function(){
					var rect1 = rectangle(0,0,10,2);
					var rect2 = rectangle(0,0,2,10);
					var rect3 = rectangle(0,8,10,2);
					var rect4 = rectangle(8,0,2,5);
					var rect5 = rectangle(8,5,2,5);
					var c = rect1;
					this.expect(c.area()).toBe(20,"the area isn't even right in step 1");
					c = c.combine(rect2);
					this.expect(c.area()).toBe(36,"area is wrong in step 2");
					c = c.combine(rect3);
					this.expect(c.area()).toBe(52,"area is wrong in step 3");
					c = c.combine(rect4);
					this.expect(c.area()).toBe(58,"area is wrong in step 4");
					c = c.combine(rect5);
					this.expect(c.area()).toBe(64,"area is wrong in step 4");
				});
				test("twiceSideOverlapTest",function(){
					var r1 = rectangle(0,0,10,5);
					var r2 = rectangle(0,0,5,10);
					var c = r1.combine(r2);
					this.expect(c.area()).toBe(75);
				});
				test("onceSideOverlapTest",function(){
					var r1 = rectangle(0,0,10,5);
					var r2 = rectangle(0,0,5,10);
					var c = r1.combine(r2);
					this.expect(c.area()).toBe(75);
				});
			});

			testSet("holelessPathTests",function(test){
				test("holelessPaths",function(){
					var c = rectangle(0,0,10,10).combineNegative(rectangle(2,2,6,6));
					var holeless = c.getHolelessPaths();

					this.expect(c.area()).toBe(64);
					this.expect(holeless.length).toBe(2);
					this.expect(holeless
							.map(function(h){return h.area();})
							.reduce(function(a,b){return a+b;})
						).toBe(64);
				});
				
				test("holelessPaths2",function(){
					var c = rectangle(0,0,20,10).combineNegative(rectangle(2,2,6,6)).combineNegative(rectangle(12,2,6,6));
					var holeless = c.getHolelessPaths();

					this.expect(c.area()).toBe(128);
					this.expect(holeless.length).toBe(3);
					this.expect(holeless
							.map(function(h){return h.area();})
							.reduce(function(a,b){return a+b;})
						).toBe(128);
				});
				test("holelessPathsWithRotationTest1",function(){
					var c = rectangle(0,0,20,10)
						.combineNegative(rectangle(2,2,6,6))
						.combineNegative(rectangle(12,2,6,6))
						.rot(Math.PI/2);
					var holeless = c.getHolelessPaths();

					this.expect(c.area()).toBe(128, "initial area");
					this.expect(holeless.length).toBe(2);
					this.expect(holeless
							.map(function(h){return h.area();})
							.reduce(function(a,b){return a+b;})
						).toBe(128, "area of sum of holeless paths");
				});
				test("holelessPaths5",function(){
					var contour2 = rectangle(10,10,10,10).combine(rectangle(7,7,6,6));
					var contour1 = contour2.combineNegative(rectangle(8,8,4,4));

					var holeless = contour1.getHolelessPaths();
					this.expect(holeless.length).toBe(2);
				});
				test("holelessPathsWithRotationTest2",function(){
					var c = rectangle(0,0,20,20).combineNegative(rectangle(5,5,10,10)).rot(Math.PI/4);
					var holeless = c.getHolelessPaths();

					this.expect(c.area()).toBe(300, "initial area");
					this.expect(holeless
							.map(function(h){return h.area();})
							.reduce(function(a,b){return a+b;})
							).toBe(300, "combined are of holeless");
				});
			})

			testSet("otherTests",function(test){
				test("intersectionTest1", function(){
					var p = intersectSegments(point(0,10),point(10,10),point(7,7),point(7,17));
					this.expect(p[0].x).toBe(7);
					this.expect(p[0].y).toBe(10);
				});

				test("intersectionTest2",function(){
					var p = intersectSegments(point(0,0),point(0,12.25),point(1.25,8),point(0,8));
					this.expect(p[0].x).toBe(0);
					this.expect(p[0].y).toBe(8);
				});
				
				test("reverseTest1",function(){
					var a =side(point(0,0), point(1,0)).reverse();
				});
				test("firstAfterLastBefore",function(){
					var s = rectangleSide(0,0,10,10).find(function(s){return s.to.equals(point(0,0));});

					this.assert(s.firstPointAfter(point(0,0)).equals(point(0,10)));
					this.assert(s.firstPointAfter(point(5,0)).equals(point(0,0)));
					this.assert(s.lastPointBefore(point(0,0)).equals(point(10,0)));
					this.assert(s.lastPointBefore(point(5,0)).equals(point(10,0)));
				});
				
				
				
				test("longSideTest",function(){
					var s1 = side.fromString("(14.25,10.25)-->(14.25,10)-->(12.25,10)-->(12.25,3.25)-->(13.25,3.25)-->(13.25,3)-->(12.25,3)-->(12.25,1.25)-->(14,1.25)-->(14,2)-->(13,2)-->(13,2.25)-->(14,2.25)-->(14,3.25)-->(15,3.25)-->(15,4)-->(14,4)-->(14,6.25)-->(14.25,6.25)-->(14.25,4.25)-->(15.25,4.25)-->(15.25,3)-->(14.25,3)-->(14.25,1)-->(12,1)-->(12,10)-->(8.25,10)-->(8.25,2)-->(6.25,2)-->(6.25,1)-->(6,1)-->(6,5)-->(4,5)-->(4,9)-->(1.25,9)-->(1.25,2)-->(1,2)-->(1,10.25)-->(4.25,10.25)-->(4.25,10)-->(1.25,10)-->(1.25,9.25)-->(4.25,9.25)-->(4.25,5.25)-->(7.25,5.25)-->(7.25,3)-->(7,3)-->(7,5)-->(6.25,5)-->(6.25,2.25)-->(8,2.25)-->(8,7)-->(7,7)-->(7,8.25)-->(7.25,8.25)-->(7.25,7.25)-->(8,7.25)-->(8,11.25)-->(15.25,11.25)-->(15.25,7)-->(14,7)-->(14,7.25)-->(15,7.25)-->(15,9)-->(13,9)-->(13,9.25)-->(15,9.25)-->(15,11)-->(8.25,11)-->(8.25,10.25)-->(14.25,10.25)");
					var s2 = side.fromString("(16,0.25)-->(16,2)-->(15.25,2)-->(15.25,1)-->(15,1)-->(15,2.25)-->(16,2.25)-->(16,5)-->(15,5)-->(15,6)-->(13.25,6)-->(13.25,4)-->(13,4)-->(13,8.25)-->(14.25,8.25)-->(14.25,8)-->(13.25,8)-->(13.25,6.25)-->(15.25,6.25)-->(15.25,5.25)-->(16,5.25)-->(16,12)-->(0.25,12)-->(0.25,11.25)-->(5.25,11.25)-->(5.25,10.25)-->(6.25,10.25)-->(6.25,10)-->(5.25,10)-->(5.25,6.25)-->(6,6.25)-->(6,9.25)-->(7,9.25)-->(7,11)-->(6,11)-->(6,11.25)-->(7.25,11.25)-->(7.25,9)-->(6.25,9)-->(6.25,6.25)-->(7.25,6.25)-->(7.25,6)-->(5,6)-->(5,11)-->(0.25,11)-->(0.25,0.25)-->(4,0.25)-->(4,1.25)-->(4.25,1.25)-->(4.25,0.25)-->(5,0.25)-->(5,4)-->(3,4)-->(3,8)-->(2.25,8)-->(2.25,1.25)-->(3,1.25)-->(3,2.25)-->(4,2.25)-->(4,3)-->(3,3)-->(3,3.25)-->(4.25,3.25)-->(4.25,2)-->(3.25,2)-->(3.25,1)-->(1,1)-->(1,1.25)-->(2,1.25)-->(2,8.25)-->(3.25,8.25)-->(3.25,4.25)-->(5.25,4.25)-->(5.25,0.25)-->(11,0.25)-->(11,8)-->(10,8)-->(10,8.25)-->(11,8.25)-->(11,9)-->(9.25,9)-->(9.25,1.25)-->(10,1.25)-->(10,7.25)-->(10.25,7.25)-->(10.25,1)-->(7,1)-->(7,1.25)-->(9,1.25)-->(9,9.25)-->(11.25,9.25)-->(11.25,0.25)-->(16,0.25)");
					var s3 = side.fromString("(0,0)-->(0,12.25)-->(16.25,12.25)-->(16.25,0)-->(0,0)");
					var c1 = contour([s2,s3]);
					var c2 = contour([s1]);
					var newOne = c1.combine(c2);
					this.expect(newOne.sides.length).toBe(2, "expected two sides:an outer one and a hole");
				});
				
				test("something",function(){
					//try to reproduce this:
					//combination of contour1 with sides [(17.25,12)-->(0,12)-->(0,12.25)-->(17.25,12.25)-->(17.25,12)] and contour2 with sides [(0.25,0)-->(0,0)-->(0,12.25)-->(0.25,12.25)-->(0.25,0)] resulted in a contour with no sides
					var contour1 = contour([side.fromString("(17.25,12)-->(0,12)-->(0,12.25)-->(17.25,12.25)-->(17.25,12)")]);
					var contour2 = contour([side.fromString("(0.25,0)-->(0,0)-->(0,12.25)-->(0.25,12.25)-->(0.25,0)")]);
					this.expect(contour1.combine(contour2).sides.length).toBe(1);
				});
				test("something3",function(){
					var s1 = side.fromString("(10,10)-->(10,8)-->(2,8)-->(2,2)-->(10,2)-->(10,0)-->(0,0)-->(0,10)-->(10,10)");
					var s2 = side.fromString("(8,0)-->(8,10)-->(10,10)-->(10,0)-->(8,0)");
					var c = combine(s1, s2);
					this.expect(c.length).toBe(4);
					c = c.map(function(s){return s.clean();});
					this.expect(c.some(function(s){return s.length() != 4;})).toBe(false, "expected all cleaned resulting sides to have length 4")
				});
				
				
				test("something2",function(){
					var side1 = side.fromString("(0,0)-->(0,0.25)-->(12.25,0.25)-->(12.25,0)-->(0,0)");
					var side2 = side.fromString("(12,0)-->(12,12.25)-->(12.25,12.25)-->(12.25,0)-->(12,0)");
					var c = combine(side1,side2);
					this.expect(c.length).toBe(2);
					this.expect(c[0].isSelfIntersecting()).toBe(false);
				});
				
			});

			
		};
	};
})();