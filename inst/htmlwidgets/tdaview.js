HTMLWidgets.widget({ 
	name: 'tdaview',
	type: 'output',
	
	factory: function(element, width, height) {
		var camera, hudCamera;
		var renderer, labelRenderer;
		var nodeLegend, edgeLegend;
		var frustumSize = 1000;
		var shouldPaint = true;
		var shouldAutoResize = true;
		var shouldShareMap = true;

		return {
			renderValue: function(x) {
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
				scene.background = new THREE.Color(0x4b515b);

				//Create renderers
				renderer = new THREE.WebGLRenderer({antialias: true, alpha: true, preserveDrawingBuffer: true });
				renderer.setSize(width, height);
				renderer.setPixelRatio( window.devicePixelRatio );
				renderer.setClearColor(0x000000, 0);
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
				var data = new Data(x.mapper, x.metadata);
				//var data = Data.generateRandom();
				
				//Create maps and legends
				var nodeMap = new ColorMap('rainbow', 256);
				nodeLegend = new MultiLegend(nodeMap, hudScene, hudCamera.right, hudCamera.bottom, aspect/2);

				var edgeMap = new ColorMap('rainbow', 512);
				edgeLegend = new MultiLegend(edgeMap, hudScene, hudCamera.right, hudCamera.bottom + 80, aspect/2);

				//Create graph with point count radius initially
				var graph = new forceGraph(data.getBins(), data.getAdjacency(), new Array(100).fill(""), nodeMap, shouldShareMap ? nodeMap : edgeMap);
				for(let i=0; i<graph.nodes.length; i++) {
					graph.nodes[i].setRadius(0.5);
				}

				scene.add(graph);

				//Create menu
				var sidebar = new menu(graph, element, data);

				sidebar.eventSystem.addEventListener("OnNodeLegendToggle", function(value) {
					nodeLegend.setVisible(value);
					shouldPaint = true;
				});

				sidebar.eventSystem.addEventListener("OnEdgeLegendToggle", function(value) {
					edgeLegend.setVisible(value);
					shouldPaint = true;
				})

				//Change node size to uniform, point count or variable
				sidebar.eventSystem.addEventListener("OnNodeSizeChange", function(value) {
					switch(value) {
						case "none": graph.nodes.forEach(n => n.setRadius(0.5)); break;
						case "content": graph.nodes.forEach(n => n.setRadius(data.getPointsNormalised(n.userData))); break;
					}
					graph.links.forEach(l => {l.setPositionFromNodes(); l.updatePosition();});
					shouldPaint = true;
				});

				sidebar.eventSystem.addEventListener("OnNodeSizeVariableChange", function(value) {
					data.loadVariable(value);
					graph.nodes.forEach(n => n.setRadius(data.getContinuousNormalised(n.userData, "mean")));
					graph.links.forEach(l => {l.setPositionFromNodes(); l.updatePosition();});
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
						if(shouldShareMap) graph.links.forEach(l => l.setColor(0.5));
						nodeLegend.setNone();
					}
					if(shouldShareMap) graph.links.forEach(l => l.updateColor());
					shouldPaint = true;
				});

				sidebar.eventSystem.addEventListener("OnNodeColorVariableChange", function(value) {
					data.loadVariable(value);
					let cachedVariable = data.getVariable();
					if(!cachedVariable.getIsCategorical()) {
						sidebar.nodeGradPicker.setState(STATE_GRADIENT);
						graph.nodes.forEach(n => n.setColor(data.getContinuousNormalised(n.userData, "mean")));
						nodeLegend.setBar(data.getContinuousMin("mean"), data.getContinuousMax("mean"));
						if(shouldShareMap) graph.links.forEach(l => l.setGradientFromNodes());
					} else {
						let categories = cachedVariable.getCategorical().getCategories();
						sidebar.nodeGradPicker.setState(STATE_FIXED, categories.length);

						for(let i=0; i<graph.nodes.length; i++) {
							graph.nodes[i].setColorPie(graph.nodes[i].userData.getCategorical().getValuesNormalised());
						}

						if(shouldShareMap) graph.links.forEach(l => l.setGradientFromNodes()); //Setting gradient makes no sense for pie uvs when there are more than 2 slices!
						nodeLegend.setPie(categories, categories.length);
					}
					if(shouldShareMap) graph.links.forEach(l => l.updateColor());
					shouldPaint = true;
				});

				//Change edge width
				sidebar.eventSystem.addEventListener("OnEdgeWidthChange", function(percent) {
					link.setWidth(percent);
					graph.links.forEach(l => {l.setPositionFromNodes(); l.updatePosition();});
					shouldPaint = true;
				});

				//Reset edge width
				sidebar.eventSystem.addEventListener("ResetEdgeWidth", function() {
					link.setWidth(0.5);
					graph.links.forEach(l => {l.setPositionFromNodes(); l.updatePosition();});
					shouldPaint = true;
					var slider = document.forms["edge-slider"];
					slider.reset();
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
						sidebar.edgeGradPicker.setState(STATE_SINGLE); //STATE_DISABLED
						graph.links.forEach(l => {l.setGradientFromNodes(); l.updateColor()});
						edgeLegend.setNone();
						shouldShareMap = true;
					} else if(value === "uniform") {
						graph.setLinkColorMap(edgeMap);
						sidebar.edgeGradPicker.setState(STATE_SINGLE);
						edgeLegend.setNone();
						shouldShareMap = false;
					} else {
						graph.setLinkColorMap(edgeMap);
						sidebar.edgeGradPicker.setState(STATE_GRADIENT);

						graph.links.forEach(l => {l.setGradient(data.getContinuousBinVariableValueNormalised(l.source.userData, value, "mean"), data.getContinuousBinVariableValueNormalised(l.target.userData, value, "mean")); l.updateColor()})
						edgeLegend.setBar(data.getContinuousMin(value, "mean"), data.getContinuousMax(value, "mean"));
						shouldShareMap = false;
					}
					shouldPaint = true;
				});

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

				//Download image generated from export div
				sidebar.eventSystem.addEventListener("OnExport", function(value) {
					html2canvas(exportDiv, {
						width: width + 250,
						height: height
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

				//Zoom camera to accommodate simulated graph bounds
				graph.eventSystem.addEventListener("onTick", function() {
					if(graph.initiallizing && shouldAutoResize) {
						var box = graph.getBoundingBox();
						camera.zoom = Math.min(width / (box.max.x - box.min.x), height / (box.max.y - box.min.y)) * window.devicePixelRatio;
						camera.updateProjectionMatrix();
					}
					shouldPaint = true;
				});

				//Initiallise drag system
				let dragSystem = new DragSystem2D(exportDiv, renderer, camera);
				dragSystem.eventSystem.addEventListener("OnChange", function() {
					shouldPaint = true;
				});
				let graphRect = new DragRect2D(camera);
				let hudRect = new DragRect2D(hudCamera);
				graphRect.addDraggable(graph.nodes);
				hudRect.addDraggable([nodeLegend, edgeLegend]);
				dragSystem.addRect(graphRect);
				dragSystem.addRect(hudRect);

				function animate() {
					if(dragSystem.animate()) {
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
			
			resize: function(width, height) {
				width -= 250;
				var aspect = width / height;
				camera.left = - frustumSize * aspect/2;
				camera.right = frustumSize * aspect/2;
				camera.top = frustumSize/2;
				camera.bottom = - frustumSize/2;
				camera.updateProjectionMatrix();
				renderer.setSize(width, height);
				labelRenderer.setSize(width, height);
				shouldPaint = true;
			}
		};
	}
});