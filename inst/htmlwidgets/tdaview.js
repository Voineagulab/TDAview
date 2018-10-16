HTMLWidgets.widget({ 
	name: 'tdaview',
	type: 'output',
	
	factory: function(element, width, height) {
		var camera, hudCamera;
		var renderer, labelRenderer;
		var frustumSize = 1000;

		return {
			renderValue: function(x) {
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
				var nodeLegend = new Legend(nodeMap, hudScene, pointCounts.length);
				nodeLegend.setLegendColHeights(pointCounts, 0, 1);
				nodeLegend.group.position.set(width - 10, -height + 10, 1);

				//Create graph
				var graph = new forceGraph(bins, x.mapper.adjacency, nodeMap);
				for(let i=0; i<pointCounts.length; i++) {
					graph.nodes[i].setRadius(pointCounts[i]);
				}
				scene.add(graph);

				//Create menu
				var sidebar = new menu(graph, element, metaVars);

				//Change map to uniform color
				sidebar.nodeGradPicker.eventSystem.addEventListener("onColorChange", function(color) {
					nodeMap.changeColor(color);
					requestAnimationFrame(render);
				});

				//Change map to gradient
				sidebar.nodeGradPicker.eventSystem.addEventListener("onGradientChange", function(steps) {
					nodeMap.changeColorMap(steps);
					requestAnimationFrame(render);
				});

				//Change node color to uniform, gradient or pie
				sidebar.eventSystem.addEventListener("onColorMetaChange", function(checked) {
					if(checked.length == 0) {
						sidebar.nodeGradPicker.setStateSingle();
						graph.links.forEach(l => l.setColor(0.5));
					} else if(checked.length == 1) {
						sidebar.nodeGradPicker.setStateGradient();
						graph.nodes.forEach(n => n.setColor(n.mean[checked[0]]));
						graph.links.forEach(l => l.setGradientFromNodes());
					} else {
						sidebar.nodeGradPicker.setStateFixedGradient(checked.count);

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
						
						graph.links.forEach(l => l.setGradientFromNodes());
					}
					graph.links.forEach(l => l.updateColor());
				});

				//Change node size to uniform, point count or variable
				sidebar.eventSystem.addEventListener("onNodeSizeChange", function(value) {
					switch(value) {
						case "none": graph.nodes.forEach(n => n.setRadius(18)); break;
						case "content": graph.nodes.forEach(n => n.setRadius(n.points.length)); break;
						default: graph.nodes.forEach(n => n.setRadius(n.mean[value] * 18));
					}
					graph.links.forEach(l => {l.setPositionFromNodes(); l.updatePosition();});
					requestAnimationFrame(render);
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
				}) 

				//Zoom camera to accommodate simulated graph bounds
				graph.eventSystem.addEventListener("onTick", function() {
					if(graph.initiallizing) {
						var box = graph.getBoundingBox();
						camera.zoom = Math.min(width / (box.max.x - box.min.x), height / (box.max.y - box.min.y)) * 2;
						camera.updateProjectionMatrix();
					}
					requestAnimationFrame(render);
				});

				//Initiallise drag system
				let dragSystem = new DragSystem2D(exportDiv, renderer);
				dragSystem.eventSystem.addEventListener("OnChange", render);
				let graphRect = new DragRect2D(camera);
				let hudRect = new DragRect2D(hudCamera);
				graphRect.addDraggable(graph.nodes);
				hudRect.addDraggable([nodeLegend]);
				dragSystem.addRect(graphRect);
				dragSystem.addRect(hudRect);

				function render() {
					nodeLegend.animate();
					renderer.clear();
					renderer.render(scene, camera);
					renderer.render(hudScene, hudCamera);
					labelRenderer.render(scene, camera);
					labelRenderer.render(hudScene, hudCamera);
				}
			},
			
			resize: function(width, height) {
				aspect = width / height;
				camera.left = - frustumSize * aspect/2;
				camera.right = frustumSize * aspect/2;
				camera.top = frustumSize/2;
				camera.bottom = - frustumSize/2;
				camera.updateProjectionMatrix();
				renderer.setSize(width, height);
			}
		};
	}
});