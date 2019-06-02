HTMLWidgets.widget({ 
	name: 'tdaview',
	type: 'output',
	
	factory: function(element, width, height) {
		var camera, hudCamera;
		var renderer, labelRenderer;
		var nodeLegend;
		var frustumSize = 1000;
		var graph;
		var shouldPaint = true;
		var shouldAutoResize = true;
		var shouldShareMap = true;

		return {
			renderValue: function(x) {
				if (!WEBGL.isWebGLAvailable() ) {
					var warning = WEBGL.getWebGLErrorMessage();
					document.getElementById( 'container' ).appendChild( warning );
					return;
				}

				width -= 250;

				//Create cameras
				var aspect = width / height;
				camera = new THREE.OrthographicCamera(frustumSize*aspect/-2, frustumSize*aspect/2, frustumSize/2, frustumSize/-2, 1, 2000);
				camera.position.z = 400;
				hudCamera = new THREE.OrthographicCamera(frustumSize*aspect/-2, frustumSize*aspect/2, frustumSize/2, frustumSize/-2, 1, 2000);
				hudCamera.position.z = 400;

				//Create scenes
				var scene = new THREE.Scene();
				var hudScene = new THREE.Scene();

				//Create renderers
				renderer = new THREE.WebGLRenderer({antialias: true, alpha: true, preserveDrawingBuffer: true });
				renderer.context.disable(renderer.context.DEPTH_TEST)
				renderer.setSize(width, height);
				renderer.setPixelRatio( window.devicePixelRatio );
				renderer.setClearColor(0xffffff, 1.0);
				renderer.depth = false;
				renderer.sortObjects = false;
				renderer.autoClear = false;
				labelRenderer = new THREE.CSS2DRenderer();
				labelRenderer.setSize(width, height);
				labelRenderer.domElement.setAttribute("id", "labelcanvas");

				//Add renderers to export DOM
				var exportDiv = document.createElement('div');
				exportDiv.setAttribute("id", "export");
				element.appendChild(exportDiv);
				exportDiv.appendChild(renderer.domElement);
				exportDiv.appendChild(labelRenderer.domElement);

				//Parse imported data
				var data = x.random ? Data.generateRandom() : new Data(x.mapper, x.metadata);
				
				//Create maps and legends
				var nodeMap = new ColorMap('rainbow', 256);
				nodeLegend = new MultiLegend(nodeMap, hudScene, hudCamera.right, hudCamera.bottom);

				var edgeMap = new ColorMap('rainbow', 512);

				//Create graph with point count radius initially
				graph = new forceGraph(data.getBins(), data.getAdjacency(), nodeMap, shouldShareMap ? nodeMap : edgeMap);
				graph.nodes.forEach(n => graph.setNodeScale(n, 0.5));
				graph.updateNodeScales();

				scene.add(graph);

				//Create menu
				var sidebar = new menu(graph, element, data);

				sidebar.eventSystem.addEventListener("OnNodeLegendToggle", function(value) {
					nodeLegend.setVisible(value);
					shouldPaint = true;
				});

				//Change node size to uniform, point count or variable
				sidebar.eventSystem.addEventListener("OnNodeSizeChange", function(value) {
					switch(value) {
						case "none": graph.nodes.forEach(n => graph.setNodeScale(n, 0.5)); break;
						case "content": graph.nodes.forEach(n => graph.setNodeScale(n, data.getPointsNormalised(n.userData))); break;
					}
					graph.updateNodeScales();
					graph.applyLinkPositions();
					shouldPaint = true;
				});

				sidebar.eventSystem.addEventListener("OnNodeSizeVariableChange", function(value) {
					data.loadVariable(value);
					graph.nodes.forEach(n => graph.setNodeScale(n, data.getContinuousNormalised(n.userData, "mean")));
					graph.updateNodeScales();
					graph.applyLinkPositions();
					shouldPaint = true;
				});

				//Change map to uniform color
				sidebar.nodeGradPicker.eventSystem.addEventListener("OnColorChange", function(color) {
					nodeMap.changeColor(color);
					shouldPaint = true;
				});

				//Change map to gradient
				sidebar.nodeGradPicker.eventSystem.addEventListener("OnGradientChange", function(steps) {
					nodeMap.changeColorMap(steps);
					shouldPaint = true;
				});

				//Change node color to uniform, gradient or pie
				sidebar.eventSystem.addEventListener("OnNodeColorChange", function(value) {
					if(value === "uniform") {
						sidebar.nodeGradPicker.setState(STATE_SINGLE);
						if(shouldShareMap) graph.links.forEach(l => graph.setLinkColor(l, 0.5));
						nodeLegend.setNone();
					}
					if(shouldShareMap) graph.updateLinkColors();
					shouldPaint = true;
				});

				sidebar.eventSystem.addEventListener("OnNodeColorVariableChange", function(value) {
					data.loadVariable(value);
					let cachedVariable = data.getVariable();
					if(!cachedVariable.getIsCategorical()) {
						sidebar.nodeGradPicker.setState(STATE_GRADIENT);
						graph.nodes.forEach(n => graph.setNodeColor(n, data.getContinuousNormalised(n.userData, "mean")));
						nodeLegend.setBar(data.getContinuousMin("mean"), data.getContinuousMax("mean"));
						if(shouldShareMap) graph.links.forEach(l => graph.setLinkGradientFromNodes(l));
					} else {
						let categories = cachedVariable.getCategorical().getCategories();
						sidebar.nodeGradPicker.setState(STATE_FIXED, categories.length);

						for(let i=0; i<graph.nodes.length; i++) {
							let percentages = graph.nodes[i].userData.getCategorical().getValuesNormalised();
							let colors = Array.from({length: percentages.length}, (_, i) => i/(percentages.length-1));
							graph.setNodePie(graph.nodes[i], percentages, colors);
						}

						if(shouldShareMap) graph.links.forEach(l => graph.setLinkGradientFromNodes(l));
						nodeLegend.setPie(categories, categories.length);
					}
					if(shouldShareMap) graph.updateLinkColors();
					graph.updateNodeColors();
					shouldPaint = true;
				});

				//Change edge alpha
				sidebar.eventSystem.addEventListener("OnEdgeAlphaChange", function(percent) {
					graph.setLinkAlpha(percent);
					shouldPaint = true;
				});

				//Change edge width
				sidebar.eventSystem.addEventListener("OnEdgeWidthChange", function(percent) {
					graph.setLinkWidth(percent);
					graph.applyLinkPositions();
					shouldPaint = true;
				});

				//Uniform edge color change
				sidebar.edgeGradPicker.eventSystem.addEventListener("OnColorChange", function(color) {
					edgeMap.changeColor(color);
					shouldPaint = true;
				})

				//Gradient edge color change
				sidebar.edgeGradPicker.eventSystem.addEventListener("OnGradientChange", function(steps) {
					edgeMap.changeColorMap(steps);
					shouldPaint = true;
				})

				//Edge color type change
				sidebar.eventSystem.addEventListener("OnEdgeColorChange", function(value) {
					if(value === "nodes") {
						graph.setLinkColorMap(nodeMap);
						graph.applyLinkPositions();
						graph.links.forEach(l => graph.setLinkGradientFromNodes(l));
						graph.updateLinkColors();
						shouldShareMap = true;
					} else if(value === "uniform") {
						graph.setLinkColorMap(edgeMap);
						shouldShareMap = false;
					}
					shouldPaint = true;
				});

				//Label color type change
				sidebar.eventSystem.addEventListener("OnLabelColorChange", function(value) {
					if(value === "background") {
						shouldSetLabelColorAutomatically = true;
						setLabelColorsAutomatic(customBackgroundColor); //TODO: Changing background while automatic label color is disabled prevents labels from switching to black/white when they should
					} else if(value === "uniform") {
						shouldSetLabelColorAutomatically = false;
						setLabelColors(customLabelColor);

					}
					shouldPaint = true;
				});

				//Label size change
				sidebar.eventSystem.addEventListener("OnLabelSizeChange", function(value) {
					graph.setFontSize(value);
					graph.updateNodeLabelSizes();
				});


				sidebar.backColorPicker.eventSystem.addEventListener("OnColorChange", function(color) {
					let col = new THREE.Color("#" + color);
					//document.body.style.backgroundColor = "#" + color; //TODO: this doesn't work with HTML2CANVAS
					renderer.setClearColor(col);
					graph.setBackgroundColor(col);
					if(shouldSetLabelColorAutomatically) {
						customBackgroundColor = color;
						setLabelColorsAutomatic(customBackgroundColor);
					}
					shouldPaint = true;
				});

				sidebar.backColorPicker.picker.set("#252a33");

				//Toggle visibility of legends
				sidebar.eventSystem.addEventListener("OnLegendToggle", function(val) {
					if(val.value == "node-colour-legend") {
						console.log("The user picked the",val.value,"option!");
						//TODO
					} else if (val.value == "node-size-legend") {
						console.log("The user picked the",val.value,"option!");
						//TODO
					}
				});

				var colorableLabels = document.getElementsByClassName("label");
				var customLabelColor = "ffffff";
				var customBackgroundColor = "000000";
				var shouldSetLabelColorAutomatically = true;
				var setLabelColors = function(color) {
					for(let i=0; i<colorableLabels.length; i++) {
						colorableLabels[i].style.color = "#" + color;
					}
					nodeLegend.setTextColor(color);
					graph.setSelectColor(color);
					shouldPaint = true;
				};

				var setLabelColorsAutomatic = function(backgroundColor) {
					var targetObject = {};
					let colorObject = new THREE.Color("#" + backgroundColor);
					let lightness = colorObject.getHSL(targetObject).l;
					if(lightness < 0.1833) {
						setLabelColors("ffffff");

					} else if(lightness > 0.175) {
						setLabelColors("000000");
					}
				}

				sidebar.labelGradPicker.eventSystem.addEventListener("OnColorChange", function(color) {
					customLabelColor = color;
					if(!shouldSetLabelColorAutomatically) {
						setLabelColors(color);
					}
				});


				//Download image generated from export div
				sidebar.eventSystem.addEventListener("OnExport", function(value) {
					//Shiny.onInputChange("mygraph_render_as_format", "pdf");
					
					html2canvas(exportDiv, {
						x: 250,
						width: width,
						height: height,
					}).then(function(canvas) {
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
				});

				sidebar.eventSystem.addEventListener("OnZoomChange", function(value) {
					camera.zoom = THREE.Math.lerp(getZoomMin(window.devicePixelRatio), getZoomMax(), value);
					camera.updateProjectionMatrix();
					graph.setPixelZoom(camera.zoom * window.innerHeight * window.devicePixelRatio / frustumSize * 2);
					graph.setFontZoom(camera.zoom);
					graph.updateNodeLabelSizes();
					shouldAutoResize = false;
					shouldPaint = true;
				});

				graph.eventSystem.addEventListener("OnNodeSelect", function() {
					shouldPaint = true;
				});

				//Zoom camera to accommodate simulated graph bounds
				
				graph.eventSystem.addEventListener("onTick", function() {
					if(graph.initiallizing && shouldAutoResize) {
						camera.zoom = getZoomMin(window.devicePixelRatio);
						camera.updateProjectionMatrix();
						graph.setFontZoom(camera.zoom);
						graph.updateNodeLabelSizes();
						graph.setPixelZoom(camera.zoom * window.innerHeight * window.devicePixelRatio / frustumSize * 2);
					}
					shouldPaint = true;
				});

				function getZoomMin(pixelRatio) {
					var box = graph.getBoundingBox();
					return Math.min(width / (box.max.x - box.min.x), height / (box.max.y - box.min.y)) * pixelRatio;
				}

				function getZoomMax(pixelRatio) {
					return 50;
				}

				//Initiallise drag system
				let navSystem = new NavSystem2D(exportDiv, renderer, camera, scene);
				navSystem.eventSystem.addEventListener("OnChange", function() {
					shouldPaint = true;
				});
				let graphRect = new DragRect2D(camera, scene);
				let hudRect = new DragRect2D(hudCamera, hudScene);
				graphRect.addDraggable(graph.nodes);
				hudRect.addDraggable([nodeLegend]);
				hudRect.addDraggable(nodeLegend.scaleGraphic.handles);
				navSystem.addRect(graphRect);
				navSystem.addRect(hudRect);

				function animate() {
					if(navSystem.animate()) {
						graph.setPixelZoom(camera.zoom * window.innerHeight * window.devicePixelRatio / frustumSize * 2);
						sidebar.setZoomCustom((camera.zoom - getZoomMin(window.devicePixelRatio))/getZoomMax());
						graph.setFontZoom(camera.zoom);
						graph.updateNodeLabelSizes();
						shouldAutoResize = false;
						shouldPaint = true;
					}

					if(shouldPaint) {
						render();
						shouldPaint = false;
					}
					requestAnimationFrame(animate);
				}

				function render() {
					renderer.clear();
					renderer.render(scene, camera);
					renderer.render(hudScene, hudCamera);
					labelRenderer.render(scene, camera);
					labelRenderer.render(hudScene, hudCamera);
				}
				animate();
			},
			
			resize: function(newWidth, newHeight) {
				width = newWidth - 250;
				height = newHeight;
				var aspect = width / height;
				camera.left = - frustumSize * aspect/2;
				camera.right = frustumSize * aspect/2;
				camera.top = frustumSize/2;
				camera.bottom = - frustumSize/2;
				camera.updateProjectionMatrix();
				renderer.setSize(width, height);
				renderer.setPixelRatio(window.devicePixelRatio);
				labelRenderer.setSize(width, height);
				graph.setPixelZoom(camera.zoom * height * window.devicePixelRatio / frustumSize * 2);
				shouldPaint = true;
			}
		};
	}
});