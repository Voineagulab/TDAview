//Don't store layout in URL - (2000 character limit)
//Save/load preferences json object?
//Only gradient save?
HTMLWidgets.widget({ 
	name: 'tdaview',
	type: 'output',
	
	factory: function(element, width, height) {
		var graph;
		var shouldShareMap = true;

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
				var edgeMap = new ColorMap();

				graph = new Graph(element, nodes, links, nodeMap, nodeMap);
				graph.forEachNode(n => graph.setNodeScale(n, 0.5));
				graph.updateNodeScales();

				var sidebar = new Sidebar(element, data);
				sidebar.OnNodeSizeUniform = function() {
					graph.forEachNode(n => graph.setNodeScale(n, 0.5));
					graph.updateNodeScales();
					graph.applyLinkPositions();
					graph.applyLabelPositions();
					graph.update();
				}

				sidebar.OnNodeSizePoints = function() {
					graph.forEachNode(n => graph.setNodeScale(n, data.getPointsNormalised(n.userData)));
					graph.updateNodeScales();
					graph.applyLinkPositions();
					graph.applyLabelPositions();
					graph.update();
				}

				sidebar.OnNodeSizeVariable = function(value) {
					data.loadVariable(value);
					graph.forEachNode(n => graph.setNodeScale(n, data.getContinuousNormalised(n.userData, "mean")));
					graph.updateNodeScales();
					graph.applyLinkPositions();
					graph.update();
				}

				sidebar.OnNodeColorUniform = function() {
					//TODO legend switching
				}

				sidebar.OnNodeColorVariable = function(value) {
					data.loadVariable(value);
					let cachedVariable = data.getVariable();
					if(!cachedVariable.getIsCategorical()) {
						graph.forEachNode(n => graph.setNodeColor(n, data.getContinuousNormalised(n.userData, "mean")));
						if(shouldShareMap) {
							graph.setLinkGradientsFromNodes();
						}
					} else {
						for(let i=0; i<graph.nodes.length; i++) {
							let percentages = graph.nodes[i].userData.getCategorical().getValuesNormalised();
							let colors = Array.from({length: percentages.length}, (_, i) => i/(percentages.length-1));
							graph.setNodePie(graph.nodes[i], percentages, colors);
						}

						if(shouldShareMap) {
							graph.links.setLinkGradientsFromNodes();
						}
						//let categories = cachedVariable.getCategorical().getCategories(); //TODO: set legend categories here
					}
					if(shouldShareMap) graph.updateLinkColors();
					graph.updateNodeColors();
					graph.update();
				}

				sidebar.OnNodeColorChange = function(color) {
					nodeMap.changeColor(color);
					graph.update();
				}

				sidebar.OnNodeGradientChange = function(steps) {
					nodeMap.changeColorMap(steps);
					graph.update();
				}

				sidebar.OnEdgeAlphaChange = function(alpha) {
					graph.setLinkAlpha(alpha);
					graph.update();
				}

				sidebar.OnEdgeWidthChange = function(width) {
					graph.setLinkWidth(width);
					graph.applyLinkPositions();
					graph.update();
				}

				sidebar.OnEdgeColorUniform = function() {
					graph.setLinkColorMap(edgeMap);
				}

				sidebar.OnEdgeColorFromNodes = function() {
					graph.setLinkColorMap(nodeMap);
					graph.applyLinkPositions();
					graph.setLinkGradientsFromNodes();
					graph.updateLinkColors();
					graph.update();
					shouldShareMap = true;
				}

				sidebar.OnEdgeColorChange = function(color) {
					edgeMap.changeColor(color);
					graph.update();
				}

				sidebar.OnLabelSizeChange = function(value) {
					graph.setFontSize(value);
					graph.updateLabelSizes();
				}

				sidebar.OnLabelColorChange = function(value) {
					customLabelColor = color;
					if(!shouldSetLabelColorAutomatically) {
						setLabelColors(color);
					}
				};

				sidebar.OnLabelTextName = function() {
					graph.setLabelVisibilities(true);

				}

				sidebar.OnLabelTextPoints = function() {
					graph.setLabelVisibilities(true);

				}

				sidebar.OnLabelTextNone = function() {
					graph.setLabelVisibilities(false);
				}

				sidebar.OnLabelColorUniform = function(color) {
					shouldSetLabelColorAutomatically = false;
					setLabelColors(customLabelColor);
				}

				//TODO: Copy old background variables/predicates from github
				sidebar.OnLabelColorFromBackground = function() {
					shouldSetLabelColorAutomatically = true;
					setLabelColorsAutomatic(customBackgroundColor);
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
				}

				sidebar.OnZoom = function(value) {
					graph.setZoom(value);
					graph.update();
				}

				graph.OnNodeSelect = function(node) {
					sidebar.OpenSelectionMenu();
				}

				graph.OnNodeDeselect = function(node) {
					sidebar.CloseSelectionMenu();
				}

				element.addEventListener("wheel", function(e) {
					if(!e.ctrlKey) {
						let curr = graph.getZoom();
						curr += (e.deltaY > 0) ? 0.01 : -0.01;
						//graph.setZoom(Math.max(1.0, Math.min(0.0, curr)));
						graph.update();
					}
				});
			},
			
			resize: function(width, height) {
				graph.resize();
			}
		};
	}
});