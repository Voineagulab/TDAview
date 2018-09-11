HTMLWidgets.widget({
	name: 'tdaview',
	type: 'output',
	
	factory: function(element, width, height) {
		const MIN_RADIUS = 5, MAX_RADIUS = 100, MIN_ZOOM = 0.5, LINE_WIDTH = 0.3;
		var camera, hudCamera, scene, hudScene, renderer, labelRenderer, aspect, cameraTween, cameraAutoZoom = true;
		var frustumSize = 1000;
		var raycaster = new THREE.Raycaster();
		var mouseWorld = new THREE.Vector2();
		var mouse = new THREE.Vector2();
		var mouseStart = new THREE.Vector2();
		var over = null;
		var selected = null;
		var isMouseDown = false;
		var dragOffset = new THREE.Vector2();
		
		return {
			renderValue: function(x) {
				aspect = width / height;
				camera = new THREE.OrthographicCamera(frustumSize*aspect/-2, frustumSize*aspect/2, frustumSize/2, frustumSize/-2, 1, 2000);
				camera.position.z = 400;
				scene = new THREE.Scene();
				scene.background = new THREE.Color(0x4b515b);
				hudScene = new THREE.Scene();
		
				//Create graph renderer
				renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
				renderer.setSize(width, height);
				renderer.setClearColor(0x000000, 0);	// Transparent background
				renderer.autoClear = false;
				element.appendChild(renderer.domElement);
		
				//Create label renderer
				labelRenderer = new THREE.CSS2DRenderer();
				labelRenderer.setSize(width, height);
				labelRenderer.domElement.style.position = 'absolute';
				labelRenderer.domElement.style.top = 0;
				element.appendChild(labelRenderer.domElement);

				//Create legend hud
				hudCamera = new THREE.OrthographicCamera(frustumSize*aspect/-2, frustumSize*aspect/2, frustumSize/2, frustumSize/-2, 1, 2000);
				hudCamera.position.z = 400;

				//Create dropdown
				var selector = document.createElement("SELECT");
				var metaVars = Object.keys(x.data);
				for(let i=0; i<metaVars.length; i++){
					var option = document.createElement("option");
					option.setAttribute("value", metaVars[i]);
					option.innerHTML = metaVars[i];
					selector.appendChild(option);
				}
				
				//Add listener to dropdown
				selector.addEventListener("change", function(event) {
					updateColours(event.target.value);
				});

				//Add dropdown to sidebar
				document.getElementById("sidebar-controls").appendChild(selector);
				
				//Add notes to sidebar
				var notes = document.createElement('div');
				notes.innerHTML = "<br>Notes:<br>-->\
									Node size is proportional to data contained.<br>-->\
									Node and edge colour is determined by metadata variables.<br><br>";
				document.getElementById("sidebar-controls").appendChild(notes);

				/*	TODO FOR GRAPH EXPORT
					
					1. Export node labels with image.
				
				*/

				//Create export button and dropdown
				var button = document.createElement("a");
				button.setAttribute("class", "button");
				button.setAttribute("value", "Export Graph");
				button.innerHTML = "Export Graph as   ";
				var selectorExport = document.createElement("SELECT");
				selectorExport.setAttribute("id", "selectorExport");
				var option1 = document.createElement("option");
				var option2 = document.createElement("option");
				option1.setAttribute("value", "JPEG");
				option2.setAttribute("value", "PNG");
				option1.innerHTML = "JPEG";
				option2.innerHTML = "PNG";
				selectorExport.appendChild(option1);
				selectorExport.appendChild(option2);

				//Add listener to button
				button.addEventListener("click", function() {
					var e = document.getElementById("selectorExport");
					var imgtype = e.options[e.selectedIndex].value;
					button.setAttribute("download", "graph."+imgtype.toLowerCase());
					imgtype = "image/" + imgtype.toLowerCase();
					var imgdata = renderer.domElement.toDataURL(imgtype);
					imgdata = imgdata.replace(/^data:image\/[^;]*/, 'data:application/octet-stream');
					imgdata = imgdata.replace(/^data:application\/octet-stream/, 'data:application/octet-stream;headers=Content-Disposition%3A%20attachment%3B%20filename=Canvas.png');
					button.setAttribute("href", imgdata);
					//console.log(imgdata);
				});

				//Add button to sidebar
				document.getElementById("sidebar-controls").appendChild(button);
				document.getElementById("sidebar-controls").appendChild(selectorExport);

				

				/*	TODO FOR NODE SIZE DISPLAY
					1. Create new div element -> nodeDivSize
					2. nodeDivSize.textContent = x.mapper.points_in_vertex[i].length
					3. nodeLabelSize.position.set(0, -2, 0) to put in centre of node
					4. Format font, size, colour
					5. Scale size with node size
				
				*/

				//Create group to store graph 
				var graph = new THREE.Group();

				//Parse and meshify nodes
				var nodes = new Array(x.mapper.num_vertices);
				for(let i=0; i<nodes.length; i++) {
					var radius = MIN_RADIUS + x.mapper.points_in_vertex[i].length / x.data[metaVars[0]].length * (MAX_RADIUS - MIN_RADIUS);
					var circleGeom = new THREE.CircleGeometry(radius, 32);
					var circleMat = new THREE.MeshBasicMaterial();
					nodes[i] = new node(i, x.mapper.level_of_vertex[i], x.mapper.points_in_vertex[i], radius, circleGeom, circleMat);
					graph.add(nodes[i]);
			
					var nodeDiv = document.createElement('div');
					nodeDiv.className = 'label';
					nodeDiv.textContent = 'Node ' + i;
					nodeDiv.style.marginTop = '-1em';
					nodeDiv.style.fontWeight = "100";
					nodeDiv.style.opacity = "0.75";
					nodeDiv.style["-webkit-touch-callout"] = "none";
					nodeDiv.style["-webkit-user-select"] = "none";
					nodeDiv.style["-khtml-user-select"] = "none";
					nodeDiv.style["-moz-user-select"] = "none";
					nodeDiv.style["-ms-user-select"] = "none";
					nodeDiv.style["user-select"] = "none";
					
					var nodeLabel = new THREE.CSS2DObject(nodeDiv);
					nodeLabel.position.set(0, radius, 0);
					nodes[i].add(nodeLabel);
				}
			
				//Parse and meshify links
				var num = 0;
				var links = new Array(Math.pow(x.mapper.num_vertices, 2));
				for(let i=0; i<x.mapper.num_vertices; i++) {
					let row = x.mapper.adjacency[i];
					for(let j=0; j<x.mapper.num_vertices; j++) {
						if(row[j]) {
							var lineMat = new THREE.MeshBasicMaterial({vertexColors: THREE.VertexColors});
							var lineGeom = new THREE.Geometry();
							lineGeom.vertices = [new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 0, -1)];
							lineGeom.faces = [new THREE.Face3(0, 1, 2), new THREE.Face3(0, 2, 3)];
							lineGeom.faces[0].vertexColors = [new THREE.Color(), new THREE.Color(), new THREE.Color()];
							lineGeom.faces[1].vertexColors = [new THREE.Color(), new THREE.Color(), new THREE.Color()];
							links[num] = new link(nodes[i], nodes[j], lineGeom, lineMat);
							graph.add(links[num]);
							++num;
						}
					}
				}
			
				//Truncate links array
				links.length = num;

				//Create legend
				const legendColumns = 20;
				const legendWidth = 300;
				const legendHeight = 100;
				const legendColumnGap = 0.25;
				var legendColumnWidth = legendWidth/legendColumns;
				var legend = new THREE.Group();
				for(let i=0; i<legendColumns; i++) {
					var colMat = new THREE.MeshBasicMaterial({vertexColors: THREE.VertexColors});
					var colGeom = new THREE.PlaneGeometry(legendColumnWidth * legendColumnGap, 1, 1);
					colGeom.faces[0].vertexColors = [new THREE.Color(0x000000), new THREE.Color(0x000000), new THREE.Color(0x555555)];
					colGeom.faces[1].vertexColors = [new THREE.Color(0x000000), new THREE.Color(0x555555), new THREE.Color(0x555555)];
					var colMesh = new THREE.Mesh(colGeom, colMat);
					colMesh.position.set(i * legendColumnWidth, legendHeight/2, 0);
					legend.add(colMesh);
				}

				//Add legend labels
				var minDiv = document.createElement('div');
				var maxDiv = document.createElement('div');
				minDiv.style.fontWeight = maxDiv.style.fontWeight = "100";
				minDiv.style.fontSize = maxDiv.style.fontSize = "10px";
				minDiv.style.color = maxDiv.style.color = "white";
				minDiv.style["-webkit-touch-callout"] = "none";
				minDiv.style["-webkit-user-select"] = "none";
				minDiv.style["-khtml-user-select"] = "none";
				minDiv.style["-moz-user-select"] = "none";
				minDiv.style["-ms-user-select"] = "none";
				minDiv.style["user-select"] = "none";
				maxDiv.style["-webkit-touch-callout"] = "none";
				maxDiv.style["-webkit-user-select"] = "none";
				maxDiv.style["-khtml-user-select"] = "none";
				maxDiv.style["-moz-user-select"] = "none";
				maxDiv.style["-ms-user-select"] = "none";
				maxDiv.style["user-select"] = "none";
				var minLabel = new THREE.CSS2DObject(minDiv);
				minLabel.position.set(0, -10, 0);
				var maxLabel = new THREE.CSS2DObject(maxDiv);
				maxLabel.position.set(legendWidth, -10, 0);
				legend.add(minLabel);
				legend.add(maxLabel);

				hudScene.add(legend);
				legend.position.set(-width + 50, -height + 50, 1);

				//Declare method for changing color by mean
				var lut = new THREE.Lut('rainbow', '1024'); //Options: rainbow, cooltowarm, blackbody
				function updateColours(metaVar) {
					var means = new Array(x.mapper.num_vertices).fill(0);
					var min = Infinity;
					var max = -Infinity;
					for(var i=0; i<means.length; i++) {
						if(x.mapper.points_in_vertex[i].length) {
							for(var j=0; j<x.mapper.points_in_vertex[i].length; j++) {
								var point = x.data[metaVar][x.mapper.points_in_vertex[i][j]-1];
								if(point < min) min = point;
								if(point > max) max = point;
								means[i] += point;
							}
							means[i] /= x.mapper.points_in_vertex[i].length;
						}
					}

					lut.setMin(min);
					lut.setMax(max);

					//Update colours
					for(let i=0; i<nodes.length; i++) {
						nodes[i].material.color = lut.getColor(means[i]);
						nodes[i].geometry.colorsNeedUpdate = true;
					}
					for(let i=0; i<links.length; i++){
						var lineFaces = links[i].geometry.faces;
						var sourceColor = links[i].source.material.color;
						var targetColor = links[i].target.material.color;

						lineFaces[0].vertexColors[0].set(sourceColor); 
						lineFaces[0].vertexColors[1].set(sourceColor); 
						lineFaces[1].vertexColors[0].set(sourceColor);

						lineFaces[0].vertexColors[2].set(targetColor);
						lineFaces[1].vertexColors[1].set(targetColor);
						lineFaces[1].vertexColors[2].set(targetColor);

						links[i].geometry.colorsNeedUpdate = true;
					}
					
					//Update legend
					console.log(min);
					minDiv.textContent = min.toFixed(2);
					maxDiv.textContent = max.toFixed(2);
					var cols = new Array(legendColumns).fill(1);
					var maxCol = 1;
					for(let i=0; i<nodes.length; i++) {
						var col = Math.round((means[i] - min)/(max - min) * (legendColumns));
						cols[col]++;
						if(cols[col] >= maxCol) {
							maxCol = cols[col];
						}
					}

					lut.setMin(0);
					lut.setMax(legendColumns);
					for(let i=0; i<legendColumns; i++) {
						let h = cols[i]/maxCol * legendHeight;
						var childFaces = legend.children[i].geometry.faces;
						var fromColor = lut.getColor(i);
						var toColor = lut.getColor(i+1);

						legend.children[i].scale.y = h;
						legend.children[i].position.setY(h/2);
						
						childFaces[0].vertexColors[0].set(fromColor);
						childFaces[0].vertexColors[1].set(fromColor);
						childFaces[1].vertexColors[0].set(fromColor);

						childFaces[0].vertexColors[2].set(toColor);
						childFaces[1].vertexColors[1].set(toColor);
						childFaces[1].vertexColors[2].set(toColor);

						legend.children[i].geometry.colorsNeedUpdate = true;
					}
					requestAnimationFrame(render);
				}

				scene.add(graph);
				

				//Set colours
				updateColours(Object.keys(x.data)[0]);
				
				//Start simulation loop
				var simulation = d3.forceSimulation(nodes)
				.force("link", d3.forceLink(links))
				.force('center', d3.forceCenter())
				.force("charge", d3.forceManyBody().strength(-1000))
				.on("tick", function () {
					for(var i=0; i<nodes.length; i++) {
						nodes[i].position.x = nodes[i].x;
						nodes[i].position.y = nodes[i].y;
					}

					for(var i=0; i<links.length; i++) {
						var sourceNode = links[i].source;
						var targetNode = links[i].target;
						var lineGeom = links[i].geometry;

						var cross = new THREE.Vector2(-(targetNode.y - sourceNode.y), targetNode.x - sourceNode.x).normalize();

						var p0 = cross.clone().multiplyScalar(sourceNode.r * LINE_WIDTH).add(sourceNode.position);
						var p1 = cross.clone().multiplyScalar(sourceNode.r * -LINE_WIDTH).add(sourceNode.position);
						var p2 = cross.clone().multiplyScalar(targetNode.r * -LINE_WIDTH).add(targetNode.position);
						var p3 = cross.clone().multiplyScalar(targetNode.r * LINE_WIDTH).add(targetNode.position);

						lineGeom.vertices[0].x = p0.x;
						lineGeom.vertices[0].y = p0.y;
						lineGeom.vertices[1].x = p1.x;
						lineGeom.vertices[1].y = p1.y;
						lineGeom.vertices[2].x = p2.x;
						lineGeom.vertices[2].y = p2.y;
						lineGeom.vertices[3].x = p3.x;
						lineGeom.vertices[3].y = p3.y;

						links[i].geometry.verticesNeedUpdate = true;
						
						if(cameraAutoZoom) {
							var box = new THREE.Box3().setFromObject(graph);
							camera.zoom = Math.min(width / (box.max.x - box.min.x + MAX_RADIUS), height / (box.max.y - box.min.y + MAX_RADIUS)) * 2;
							camera.updateProjectionMatrix();
						}
						requestAnimationFrame(render);
					}
				})
				.on("end", function() {
					cameraAutoZoom = false;
				});


				function zoomCameraSmooth(zoomTarget, duration) {
					requestAnimationFrame(render);
					if(cameraTween) cameraTween.stop();
					cameraTween = new TWEEN.Tween({value: camera.zoom});
					cameraTween.to({value: Math.max(MIN_ZOOM, zoomTarget)}, duration);
					cameraTween.onUpdate(function() {
						requestAnimationFrame(render);
						camera.zoom = this.value;
						camera.updateProjectionMatrix();
					});
					cameraTween.easing(TWEEN.Easing.Linear.None);
					cameraTween.start();
				}
			
				//Render loop, called on simulation tick or zoom
				function render() {
					TWEEN.update()
					renderer.clear();
					renderer.render(scene, camera);
					renderer.clearDepth();
					renderer.render(hudScene, hudCamera);
					labelRenderer.render(scene, camera);
					labelRenderer.render(hudScene, hudCamera);
				}

				//Node events
				function onNodeHoverStart(node) {
					node.children[0].element.style.opacity = "1";
				}

				function onNodeHoverEnd(node) {
					node.children[0].element.style.opacity = "0.75";
				}

				function onNodeDragStart(node, position) {
					simulation.alphaTarget(0.3).restart();
					cameraAutoZoom = false;
					var elem = renderer.domElement;
					var boundingRect = elem.getBoundingClientRect();
					dragOffset.x = node.x - (+2 * (position.x - boundingRect.left) - width)/camera.zoom;
					dragOffset.y = node.y - (-2 * (position.y - boundingRect.top) + height)/camera.zoom;

				}

				function onNodeDrag(node, position) {
					var elem = renderer.domElement;
					var boundingRect = elem.getBoundingClientRect();
					node.fx = (+2 * (position.x - boundingRect.left) - width)/camera.zoom + dragOffset.x;
					node.fy = (-2 * (position.y - boundingRect.top) + height)/camera.zoom + dragOffset.y;
				}

				function onNodeDragEnd(node) {
					simulation.alphaTarget(0);
					node.fx = node.fy = null;
				}

				function onNodeSelect(node) {
					node.material.color = new THREE.Color(0x000000);
				}

				function onNodeDeselect(node) {
					node.material.color = new THREE.Color(0xffffff);
				}
				
				//Mouse events
				function mouseDown(event) {
					isMouseDown = true;
					mouse.x = mouseStart.x = event.clientX;
					mouse.y = mouseStart.y = event.clientY;
					if(over) {
						onNodeDragStart(over, mouse);
					}
				}
				
				function mouseMove(event) {
					mouse.x = event.clientX;
					mouse.y = event.clientY;
					if(isMouseDown && over) {
						onNodeDrag(over, mouse);
					} else {
						var elem = renderer.domElement;
						var boundingRect = elem.getBoundingClientRect();
						mouseWorld.x = ((mouse.x - boundingRect.left) * (elem.width / boundingRect.width))/width * 2 - 1;
						mouseWorld.y = -((mouse.y - boundingRect.top) * (elem.height / boundingRect.height))/height * 2 + 1;
						raycaster.setFromCamera(mouseWorld, camera);
						var intersects = raycaster.intersectObjects(nodes, true);
						if(intersects.length > 0) {
							if(over && intersects[0].object.id != over.id) {
								onNodeHoverEnd(over);
							}
							over = intersects[0].object;
							onNodeHoverStart(over);
						} else if(over) {
							onNodeHoverEnd(over);
							over = null;
						}
					}
					console.log(dragOffset);
				}

				function mouseUp(event) {
					var prevSelected = selected;
					if(prevSelected) {
						onNodeDeselect(selected);
						selected = null;
					}
					
					if(isMouseDown && over) {
						if(mouse.distanceTo(mouseStart) < 1) {
							if(!prevSelected || (prevSelected.id != over.id)) {
								selected = over;
								onNodeSelect(over);
							}
						} else {
							onNodeDragEnd(over);
						}
					}
					isMouseDown = false;
				}

				function mouseZoom(event) {
					cameraAutoZoom = false;
					zoomCameraSmooth(camera.zoom - event.deltaY * 0.0075, 100);
				}
				element.addEventListener('mousedown', mouseDown);
				element.addEventListener('mousemove', mouseMove);
				element.addEventListener('mouseup', mouseUp);
				element.addEventListener('wheel', mouseZoom);
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
	
	
class node extends THREE.Mesh {
	constructor(index, level, points, radius, geometry, material) {
	super(geometry, material);
		this.index = index;
		this.level = level;
		this.points = points;
		this.r = radius;
	}
}
	
class link extends THREE.Mesh {
	constructor(source, target, geometry, material) {
		super(geometry, material);
		this.source = source;
		this.target = target;
	}
}