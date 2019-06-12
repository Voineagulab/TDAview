//Don't store layout in URL - (2000 character limit)
//Save/load preferences json object?
//Only gradient save?
HTMLWidgets.widget({ 
	name: 'tdaview',
	type: 'output',
	
	factory: function(element, width, height) {
		var graph;
		

		return {
			renderValue: function(x) {
				//Check browser
				if (!Compatibility.isWebGLAvailable() ) {
					console.warn("Webgl not available - please use a newer browser.");
					return;
				} else if(!Compatibility.isES6Available()) {
					console.warn("ES6 not available - please use a newer browser.");
					return;
				}

				var shouldShareMap = true;

				var isLabelFromBackground = false;
				var backgroundColor = new THREE.Color();
				var tempColor = new THREE.Color();
				function getHighContrastColor(inColor, outColor) {
					var targetObject = {};
					let lightness = inColor.getHSL(targetObject).l;
					if(lightness < 0.1833) {
						outColor.set("white");
					} else if(lightness > 0.175) {
						outColor.set("black");
					}
					return outColor;
				}

				var data = x.random ? Data.generateRandom() : new Data(x.mapper, x.metadata);

				var nodes = new Array(data.bins.length);
				for(let i=0; i<nodes.length; i++) {
					nodes[i] = new NodeInstance(i, data.bins[i], element);
				}

				var links = [];
				for(let i=0, curr=0; i<data.adjacency.length; i++) {
					let row = data.adjacency[i];
					for(let j=0; j<i; j++) {
						if(row[j]) {
							links.push(new LinkInstance(curr++, nodes[i], nodes[j]));
							nodes[i].addNeighbor(nodes[j]);
							nodes[j].addNeighbor(nodes[i]);
						}
					}
				}
				
				var nodeMap = new ColorMap();
				var edgeMap = new ColorMap(1);

				graph = new Graph(element, nodes, links, nodeMap, nodeMap);
				graph.forEachNode(n => graph.setNodeScale(n, 0.5));
				graph.updateNodeScales();

				var sidebar = new Sidebar(element, data.getContinuousNames(), data.getCategoricalNames(), data.getHasLabels());
				sidebar.OnNodeSizeUniform = function() {
					graph.forEachNode(n => graph.setNodeScale(n, 0.5));
					graph.updateNodeScales();
					graph.applyLinkPositions();
					graph.forEachNode(n => graph.setLabelPosition(n));
					graph.update();
				};

				sidebar.OnNodeSizePoints = function() {
					graph.forEachNode(n => graph.setNodeScale(n, data.getPointsNormalised(n.userData)));
					graph.updateNodeScales();
					graph.applyLinkPositions();
					graph.forEachNode(n => graph.setLabelPosition(n));
					graph.update();
				};

				sidebar.OnNodeSizeContinuous = function(value) {
					data.loadVariable(value);
					graph.forEachNode(n => graph.setNodeScale(n, data.getContinuousNormalised(n.userData, "mean")));
					graph.updateNodeScales();
					graph.applyLinkPositions();
					graph.update();
				};

				sidebar.OnNodeColorUniform = function() {
					//TODO legend switching
				};


				sidebar.OnNodeColorContinuous = function(value) {
					data.loadVariable(value);
					graph.forEachNode(n => graph.setNodeColor(n, data.getContinuousNormalised(n.userData, "mean")));
					if(shouldShareMap) {
						graph.setLinkGradientsFromNodes();
						graph.updateLinkColors()
					}
					graph.updateNodeColors();
					graph.update();
				};

				sidebar.OnNodeColorCategorical = function(value) {
					data.loadVariable(value);
					//TODO: This is wrong for nodes that don't contain all segments
					//better to use a category id / category count to get an accurate percentage
					for(let i=0; i<graph.nodes.length; i++) {
						let percentages = graph.nodes[i].userData.getCategorical().getValuesNormalised();
						let colors = Array.from({length: percentages.length}, (_, i) => i/(percentages.length-1));
						graph.setNodePie(graph.nodes[i], percentages, colors);
					}
					if(shouldShareMap) {
						graph.setLinkGradientsFromNodes();
						graph.updateLinkColors()
					}
					graph.updateNodeColors();
					graph.update();
					return data.getVariable().getCategorical().getCategories().length;
				};

				sidebar.OnNodeColorChange = function(value) {
					var color = new THREE.Color("#" + value);
					nodeMap.setColor(color);
					graph.updateNodeColors();
					if(shouldShareMap) graph.updateLinkColors();
					graph.update();
				};

				sidebar.OnNodeGradientChange = function(steps) {
					nodeMap.setGradient(steps);
					graph.updateNodeColors();
					graph.update();
				};

				sidebar.OnEdgeAlphaChange = function(alpha) {
					graph.setLinkAlpha(alpha);
					graph.update();
				};

				sidebar.OnEdgeWidthChange = function(width) {
					graph.setLinkScale(width);
					graph.applyLinkPositions();
					graph.update();
				};

				sidebar.OnEdgeColorUniform = function() {
					graph.setLinkColorMap(edgeMap);
					graph.updateLinkColors();
					graph.update();
				};

				sidebar.OnEdgeColorFromNodes = function() {
					graph.setLinkColorMap(nodeMap);
					graph.applyLinkPositions();
					graph.setLinkGradientsFromNodes();
					graph.updateLinkColors();
					graph.update();
					shouldShareMap = true;
				};

				sidebar.OnEdgeColorChange = function(value) {
					var color = new THREE.Color("#" + value);
					edgeMap.setColor(color);
					graph.updateLinkColors();
					graph.update();
				};

				sidebar.OnLabelSizeChange = function(value) {
					graph.setFontScale(value);
				};
				
				sidebar.OnLabelColorFromBackground = function() {
					isLabelFromBackground = true;
					let colString = getHighContrastColor(backgroundColor, tempColor).getHexString();
					graph.setLabelColors(colString);
					graph.setSelectColor(colString);
				};

				sidebar.OnLabelColorUniform = function() {
					isLabelFromBackground = false;
				};

				sidebar.OnLabelColorChange = function(value) {
					graph.setLabelColors(value);
				};

				sidebar.OnLabelTextName = function() {
					graph.forEachNode(n => graph.setLabelText(n, n.userData.getName()));
					graph.setLabelVisibilities(true);
				};

				sidebar.OnLabelTextPoints = function() {
					graph.forEachNode(n => graph.setLabelText(n, n.userData.getPointCount()));
					graph.setLabelVisibilities(true);

				};

				sidebar.OnLabelTextNone = function() {
					graph.setLabelVisibilities(false);
				};

				sidebar.OnBackgroundColorChange = function(value) {
					backgroundColor.set("#" + value);
					graph.setBackgroundColor(backgroundColor);
					let colString = getHighContrastColor(backgroundColor, tempColor).getHexString();
					graph.setSelectColor(colString);
					if(isLabelFromBackground) {
						graph.setLabelColors(colString);
					}
					graph.update();
				}

				sidebar.OnExport = function(value) {
					html2canvas(graph.domElement).then(function(canvas) {
							//Generate image from canvas
							var imgtype = value.toLowerCase();
							var imgdata = canvas.toDataURL("image/" + imgtype.toLowerCase());
							imgdata = imgdata.replace(/^data:image\/[^;]*/, 'data:application/octet-stream');
							imgdata = imgdata.replace(/^data:application\/octet-stream/, 'data:application/octet-stream;headers=Content-Disposition%3A%20attachment%3B%20filename=Canvas.png');
						
							//Create element to automatically download image
							var link = document.createElement("a");
							link.setAttribute("href", imgdata);
							link.setAttribute("download", "graph." + imgtype);
							document.body.appendChild(link);
							link.click();
							document.body.removeChild(link);
						}
					);
				};

				sidebar.OnZoom = function(value) {
					graph.setZoom(value);
					graph.update();
				};

				graph.OnNodeSelect = function(node) {
					sidebar.OpenSelectionMenu("Node " + node.id, node.userData.getPoints());
				};

				graph.OnLinkSelect = function(link) {
					let points1 = link.source.userData.getPoints();
					let points2 = link.target.userData.getPoints();
					sidebar.OpenSelectionMenu("Link " + link.link_id, points1.filter(p => points2.includes(p)));
				}

				graph.OnNodeDeselect = graph.OnLinkDeselect = function() {
					sidebar.CloseSelectionMenu();
				};

				element.addEventListener("wheel", function(e) {
					if(!e.ctrlKey) {
						let curr = graph.getZoom();
						curr += (e.deltaY > 0) ? 0.01 : -0.01;
						//graph.setZoom(Math.max(1.0, Math.min(0.0, curr)));
						graph.update();
					}
				});

				sidebar.RestoreSettings();
			},
			
			resize: function(width, height) {
				graph.resize();
			}
		};
	}
});