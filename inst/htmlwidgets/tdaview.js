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
				var bins = Parser.fromTDAMapper(x.mapper, x.data, x.metadata);
				var metaVars = Parser.getCategories();

				var pointCounts = bins.map(bin => bin.points.length);

				//Create maps and legends
				var nodeMap = new ColorMap('rainbow', 256);
				nodeLegend = new MultiLegend(nodeMap, hudScene, hudCamera.right, hudCamera.bottom, aspect/2);

				var edgeMap = new ColorMap('rainbow', 512);
				edgeLegend = new MultiLegend(edgeMap, hudScene, hudCamera.right, hudCamera.bottom + 80, aspect/2);

				//Create graph
				var graph = new forceGraph(bins, x.mapper.adjacency, x.labels, nodeMap, shouldShareMap ? nodeMap : edgeMap);
				for(let i=0; i<pointCounts.length; i++) {
					graph.nodes[i].setRadius(graph.nodes[i].norm["points"]);
				}

				scene.add(graph);

				//Create menu
				var sidebar = new menu(graph, element, x.data, metaVars);

				/*----------Selected----------*/
				/*
				//Create enlarged table, hidden initially
				var tableContainer = document.createElement("div");
				tableContainer.setAttribute("id", "tableContainer");
				tableContainer.classList.add("unselectable");
				var bigTable = document.createElement("table");
				bigTable.setAttribute("id", "bigTable");
				bigTable.classList.add("unselectable");
				tableContainer.appendChild(bigTable);
				
	            var title = document.createElement("caption");
	            title.textContent = "Data for selected node";
	            var headerRow = document.createElement("tr");
	            for(let i=0; i<metaVars.length; i++) {
	                var metaVarHeader = document.createElement("th");
	                metaVarHeader.textContent = metaVars[i];
	                headerRow.appendChild(metaVarHeader);
	            }
                bigTable.appendChild(title);
                bigTable.appendChild(headerRow);
                tableContainer.style.display = "none";
				exportDiv.appendChild(tableContainer);

				//Expand table to fullscreen
				sidebar.eventSystem.addEventListener("OnTableExpansion", function() {
					var tab = document.getElementById("tableContainer");
					var btn = document.getElementById("expand-table");
					if (tab.style.display == "none") { //Display on click
						console.log("Table was just made visible");
						tab.style.display = "initial";
						btn.textContent = "Retract table";
					} else { //Hide on second click
						console.log("Table was just hidden");
						tab.style.display = "none";
						btn.textContent = "Expand table";
					}
				});
				*/

				/*----------Node Radius----------*/

				//Change node size to uniform, point count or variable
				sidebar.eventSystem.addEventListener("OnNodeSizeChange", function(value) {
					switch(value) {
						case "none": graph.nodes.forEach(n => n.setRadius(0.5)); break;
						case "content": graph.nodes.forEach(n => n.setRadius(n.norm["points"])); break;
						default: graph.nodes.forEach(n => n.setRadius(n.norm[value]));
					}
					graph.links.forEach(l => {l.setPositionFromNodes(); l.updatePosition();});
					shouldPaint = true;
				});

				/*----------Node Colour----------*/

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
				sidebar.eventSystem.addEventListener("OnNodeColorChange", function(checked) {
					if(checked.length == 0) {
						sidebar.nodeGradPicker.setState(STATE_SINGLE);
						if(shouldShareMap) graph.links.forEach(l => l.setColor(0.5));
						nodeLegend.setNone();
					} else if(checked.length == 1) {
						sidebar.nodeGradPicker.setState(STATE_GRADIENT);
						graph.nodes.forEach(n => n.setColor(n.norm[checked[0]]));
						if(shouldShareMap) graph.links.forEach(l => l.setGradientFromNodes());

						//nodeLegend.setColumn(pointCounts, Parser.getMin(checked[0]), Parser.getMax(checked[0]), pointCounts.length);
						nodeLegend.setBar(Parser.getMin(checked[0]), Parser.getMax(checked[0]));
					} else {
						sidebar.nodeGradPicker.setState(STATE_FIXED, checked.length);

						//Parse variables into normalised cumulative array
						for(let i=0; i<graph.nodes.length; i++) {
							var sum = 0;
							var pie = new Array(checked.length);
							for(let j=0; j<metaVars.length; j++) { 
								pie[j] = graph.nodes[i].norm[metaVars[j]];
								sum += pie[j];
							}
							for(let j=0; j<metaVars.length; j++) {
								pie[j] /= sum;
							}
							graph.nodes[i].setColorPie(pie);
						}

						if(shouldShareMap) graph.links.forEach(l => l.setGradientFromNodes()); //Setting gradient makes no sense for pie uvs when there are more than 2 slices!

						nodeLegend.setPie(metaVars, metaVars.length);
					}
					if(shouldShareMap) graph.links.forEach(l => l.updateColor());
					shouldPaint = true;
				});

				/*----------Edge Width----------*/

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

				/*----------Edge Colour----------*/

				sidebar.edgeGradPicker.eventSystem.addEventListener("OnColorChange", function(color) {
					edgeMap.changeColor(color);
					shouldPaint = true;
				})

				sidebar.edgeGradPicker.eventSystem.addEventListener("OnGradientChange", function(steps) {
					edgeMap.changeColorMap(steps);
					shouldPaint = true;
				})

				//Change edge colour
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
						graph.links.forEach(l => {l.setGradient(l.source.norm[value], l.target.norm[value]); l.updateColor()});
						edgeLegend.setBar(Parser.getMin(value), Parser.getMax(value));
						shouldShareMap = false;
					}
					shouldPaint = true;
				});

				//Edge colour dropdown
				sidebar.eventSystem.addEventListener("OnEdgeColorDropdown", function(val) {
					if(val == "interpolate") {
						console.log("The user picked the",val,"option!");
						//TODO
					} else { //Average
						console.log("The user picked the",val,"option!");
						//TODO
					}
				});

				/*----------Legend----------*/
				/*
				//Toggle ability to drag legends
				sidebar.eventSystem.addEventListener("ToggleDrag", function() {
					console.log("Toggle Drag was successfully toggled!");
					//TODO
				});
				*/
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
				/*
				//Change appearance of node legend
				sidebar.eventSystem.addEventListener("OnNodeLegendDropdown", function(val) {
					if(val == "line") {
						console.log("The user picked the",val,"option!");
						//TODO
					} else if (val == "distribution") {
						console.log("The user picked the",val,"option!");
						//TODO
					} else { //None
						console.log("The user picked the",val,"option!");
						//TODO
					}
				});

				//Change appearance of edge legend
				sidebar.eventSystem.addEventListener("OnEdgeLegendDropdown", function(val) {
					if(val == "line") {
						console.log("The user picked the",val,"option!");
						//TODO
					} else { //None
						console.log("The user picked the",val,"option!");
						//TODO
					}
				});
				*/
				/*----------Export----------*/

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