HTMLWidgets.widget({ 
	name: 'tdaview',
	type: 'output',
	
	factory: function(element, width, height) {
		var camera, hudCamera;
		var renderer, labelRenderer;
		var nodeLegend;
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
				var metaVars = Object.keys(x.data);
				var bins = Parser.fromTDAMapper(x.mapper, x.data);
				var pointCounts = bins.map(bin => bin.points.length);

				//Create maps and legends
				var nodeMap = new ColorMap('rainbow', 256);
				nodeLegend = new MultiLegend(nodeMap, hudScene, hudCamera.right, hudCamera.bottom, aspect/2);

				var edgeMap = new ColorMap('rainbow', 512);
				//edgeLegend = new Legend(edgeMap, hudScene, pointCounts.length);
				//edgeLegend.setLegendColHeights(pointCounts, 0, 1);
				//edgeLegend.setVisibility(true);

				//Create graph
				var graph = new forceGraph(bins, x.mapper.adjacency, nodeMap, shouldShareMap ? nodeMap : edgeMap);
				for(let i=0; i<pointCounts.length; i++) {
					graph.nodes[i].setRadius(pointCounts[i]);
				}
				scene.add(graph);

				//Create menu
				var sidebar = new menu(graph, element, metaVars);

				//Update table of values for selected node
				graph.eventSystem.addEventListener("OnNodeSelect", function(node) {
					var table = document.getElementById("tbody");
					table.innerHTML = "";
					var header = document.createElement("tr");
					var headerFill = document.createElement("th");
					var headerMean = document.createElement("th");
					var headerSd = document.createElement("th");
					headerFill.textContent = "";
					headerMean.textContent = "Mean";
					headerSd.textContent = "Correlation";
					header.appendChild(headerFill);
					header.appendChild(headerMean);
					header.appendChild(headerSd);
					table.appendChild(header);

					for(let i=0; i<metaVars.length; i++) {
						var newRow = document.createElement("tr");
						var headerVar = document.createElement("th");
						headerVar.textContent = metaVars[i];
						var meanCell = document.createElement("td");
						meanCell.textContent = Math.round(node.mean[metaVars[i]] * 100) / 100;
						var sdCell = document.createElement("td");
						sdCell.textContent = Math.round(node.sd[metaVars[i]] * 100) / 100;

						newRow.appendChild(headerVar);
						newRow.appendChild(meanCell);
						newRow.appendChild(sdCell);
						table.appendChild(newRow);
					}

					var accList = document.getElementsByClassName("accordion-item");
					for(let i=0; i<accList.length; i++) {
						if (accList[i].classList.contains("open")) {
							accList[i].classList.remove("open");
							accList[i].classList.add("close");
						}
					}
					table.parentNode.parentNode.parentNode.setAttribute("class", "accordion-item open");
				});

				//Close node data accordion when no node is selected
				graph.eventSystem.addEventListener("OnNodeDeselect", function() {
					var acc = document.getElementById("node-data").parentNode;
					acc.setAttribute("class", "accordion-item close");
					var values = document.getElementsByTagName("td");
					for(let i=0; i<values.length; i++) {
						values[i].textContent = "-";
					}
				});

				//Expand table to fullscreen
				sidebar.eventSystem.addEventListener("OnTableExpansion", function() {
					var wrapper = document.getElementById("node-data");
					//TODO
					//wrapper.style.width = "250%";
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

				sidebar.edgeGradPicker.eventSystem.addEventListener("OnColorChange", function(color) {
					edgeMap.changeColor(color);
					shouldPaint = true;
				})

				sidebar.edgeGradPicker.eventSystem.addEventListener("OnGradientChange", function(steps) {
					edgeMap.changeColorMap(steps);
					shouldPaint = true;
				})

				//Change node color to uniform, gradient or pie
				sidebar.eventSystem.addEventListener("OnNodeColorChange", function(checked) {
					if(checked.length == 0) {
						sidebar.nodeGradPicker.setState(STATE_SINGLE);
						if(shouldShareMap) graph.links.forEach(l => l.setColor(0.5));
						nodeLegend.setNone();
					} else if(checked.length == 1) {
						sidebar.nodeGradPicker.setState(STATE_GRADIENT);
						graph.nodes.forEach(n => n.setColor(n.mean[checked[0]]));
						if(shouldShareMap) graph.links.forEach(l => l.setGradientFromNodes());

						nodeLegend.setColumn(pointCounts, Math.min.apply(Math, x.data[checked]).toFixed(2), Math.max.apply(Math, x.data[checked]).toFixed(2), pointCounts.length);
					} else {
						sidebar.nodeGradPicker.setState(STATE_FIXED, checked.length);

						//Parse variables into normalised cumulative array
						for(let i=0; i<graph.nodes.length; i++) {
							var sum = 0;
							var pie = new Array(checked.length);
							for(let j=0; j<metaVars.length; j++) { 
								pie[j] = graph.nodes[i].mean[metaVars[j]];
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


				//Change node size to uniform, point count or variable
				sidebar.eventSystem.addEventListener("OnNodeSizeChange", function(value) {
					switch(value) {
						case "none": graph.nodes.forEach(n => n.setRadius(18)); break;
						case "content": graph.nodes.forEach(n => n.setRadius(n.points.length)); break;
						default: graph.nodes.forEach(n => n.setRadius(n.mean[value] * 18));
					}
					graph.links.forEach(l => {l.setPositionFromNodes(); l.updatePosition();});
					shouldPaint = true;
				});

				sidebar.eventSystem.addEventListener("OnEdgeColorChange", function(value) {
					if(value === "nodes") {
						graph.setLinkColorMap(nodeMap);
						sidebar.edgeGradPicker.setState(STATE_SINGLE); //STATE_DISABLED
						graph.links.forEach(l => {l.setGradientFromNodes(); l.updateColor()});
						shouldShareMap = true;
					} else if(value === "uniform") {
						graph.setLinkColorMap(edgeMap);
						sidebar.edgeGradPicker.setState(STATE_SINGLE);
						shouldShareMap = false;
					} else {
						graph.setLinkColorMap(edgeMap);
						sidebar.edgeGradPicker.setState(STATE_GRADIENT);
						graph.links.forEach(l => {l.setGradient(l.source.mean[value], l.target.mean[value]); l.updateColor()});
						shouldShareMap = false;
					}
					shouldPaint = true;
				})

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
				}) 

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
				hudRect.addDraggable([nodeLegend]);
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