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

				var legendBar = new LegendBar(graph.domElement);
				var legendPie = new LegendPie(graph.domElement);
				legendBar.setVisibility(false);
				legendPie.setVisibility(false);

				var sidebar = new Sidebar(element, data.getContinuousNames(), data.getCategoricalNames(), data.getHasNodeLabels());
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
					legendBar.setVisibility(false);
					legendPie.setVisibility(false);
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

					legendPie.setVisibility(false);
					legendBar.setVisibility(true);
					legendBar.setLabels(data.getContinuousMin("mean"), data.getContinuousMax("mean"));
				};
				
				//TODO this is now correct (colors=[0.2, 0.4, 0.6, 0.8] for 4 categories - steps[x].percentage and hence the underlyig texture is slightly wrong
				sidebar.OnNodeColorCategorical = function(value) {
					data.loadVariable(value);
					let categories = data.getVariable().getCategorical().getCategories();
					for(let i=0; i<graph.nodes.length; i++) {
						let percentages = [];
						let colors = [];
						for(let j=0; j<categories.length; j++) {
							let categorical = graph.nodes[i].userData.getCategorical();
							let sum = categorical.getSum();
							let count = categorical.getCount(categories[j]);

							if(count > 0) {
								percentages.push(count / sum);
								colors.push((j+1) / (categories.length+1));
							}
						}

						graph.setNodePie(graph.nodes[i], percentages, colors);
					}
					if(shouldShareMap) {
						graph.setLinkGradientsFromNodes();
						graph.updateLinkColors()
					}

					graph.updateNodeColors();
					graph.update();
					legendBar.setVisibility(false);
					legendPie.createEntries(categories);
					legendPie.setVisibility(true);
					return categories.length;
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

					if(legendBar.getVisibility()) {
						legendBar.setGradientCSS(sidebar.nodeGradPicker.getGradientCSS());
					} else {
						legendPie.setColors(steps.map(s => s.color.getHexString()));
					}
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
					legendBar.setLabelColor(colString);
					legendPie.setLabelColor(colString);
					if(isLabelFromBackground) {
						graph.setLabelColors(colString);
					}
					graph.update();
				}

				function saveAs(uri, filename) {
					var link = document.createElement('a');
					if (typeof link.download === 'string') {
						link.href = uri;
						link.download = filename;
						document.body.appendChild(link); //Firefox requires the link to be in the body
						link.click();
						document.body.removeChild(link); //remove the link when done
					} else {
						window.open(uri);
					}
				}

				sidebar.OnExportGraph = function(value) {
					html2canvas(graph.domElement).then(function(canvas) {
							var imgtype = value.toLowerCase();
							saveAs(canvas.toDataURL("image/" + imgtype.toLowerCase()), "graph." + imgtype);
						}
					);
				};

				sidebar.OnZoom = function(value) {
					graph.setZoom(value);
					graph.update();
				};

				graph.OnNodeSelect = function(node) {
					var names = node.userData.getPointNames();
					datauri = "data:text/csv;charset=utf-8," + encodeURI("Node " + node.id + "\r\n" + names.join('\r\n'));
					dataname = "Node " + node.id;
					sidebar.OpenSelectionMenu(dataname + " (" + names.length + " rows)", names);
					
				};

				graph.OnLinkSelect = function(link) {
					let i1 = link.source.userData.getPointNames();
					let i2 = link.target.userData.getPointNames();
					let names = i1.filter(i => i2.includes(i));
					datauri = "data:text/csv;charset=utf-8," + names.join(',');
					dataname = "Link " + link.link_id;
					sidebar.OpenSelectionMenu(dataname + " (" + names.length + " rows)", names);
					
				}

				graph.OnNodeDeselect = graph.OnLinkDeselect = function() {
					sidebar.CloseSelectionMenu();
					currentName = undefined;
					currentRows = undefined;
				};

				sidebar.OnExportData = function() {
					saveAs(datauri, dataname + ".csv" )
				}

				sidebar.RestoreSettings();
			},
			
			resize: function(width, height) {
				graph.resize();
			}
		};
	}
});