/*

	-> Add label selector to sidebar
	-> Selector - Display node: ['Name'|'Size']
	-> Event listener to 

*/

HTMLWidgets.widget({
	name: 'tdaview',
	type: 'output',
	
	factory: function(element, width, height) {
		const MIN_RADIUS = 5, MAX_RADIUS = 100, MIN_ZOOM = 0.5, LINE_WIDTH = 0.3;
		var camera, hudCamera, scene, hudScene, renderer, labelRenderer, cameraTween, cameraAutoZoom = true;
		var frustumSize = 1000;
		var raycaster = new THREE.Raycaster();
		var mouseWorld = new THREE.Vector2();
		var mouse = new THREE.Vector2();
		var mouseStart = new THREE.Vector2();
		var over = null;
		var selected = null;
		var isMouseDown = false;
		var dragOffset = new THREE.Vector2();
		var selectedColor = new THREE.Color(0x999999);
		
		return {
			renderValue: function(x) {
				var aspect = width / height;
				camera = new THREE.OrthographicCamera(frustumSize*aspect/-2, frustumSize*aspect/2, frustumSize/2, frustumSize/-2, 1, 2000);
				camera.position.z = 400;
				scene = new THREE.Scene();
				//scene.background = new THREE.Color(0x4b515b);
				hudScene = new THREE.Scene();

				var exportDiv = document.createElement('div');
				exportDiv.id = "export";
				element.appendChild(exportDiv);
		
				//Create graph renderer
				renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
				renderer.setSize(width, height);
				renderer.setClearColor(0x000000, 0);
				renderer.autoClear = false;
				exportDiv.appendChild(renderer.domElement);
		
				//Create label renderer
				labelRenderer = new THREE.CSS2DRenderer();
				labelRenderer.setSize(width, height);
				labelRenderer.domElement.style.position = 'absolute';
				labelRenderer.domElement.style.top = 0;
				exportDiv.appendChild(labelRenderer.domElement);

				//Create legend hud
				hudCamera = new THREE.OrthographicCamera(frustumSize*aspect/-2, frustumSize*aspect/2, frustumSize/2, frustumSize/-2, 1, 2000);
				hudCamera.position.z = 400;

				//Create sidebar
				function openSideBar() {
					sidenav.style.width = "250px";
					sidenav.style.opacity = 0.8;
					openButton.innerText = "";
					closeButton.innerText = "✕";
				}

				function closeSideBar() {
					sidenav.style.width = "0";
					openButton.innerText = "☰";
					closeButton.innerText = "";
				}

				var sidenav = document.createElement('div');
				element.appendChild(sidenav);
				sidenav.appendChild(document.createElement("br"));
				sidenav.style.height = height + "px";
				sidenav.style.position = 'absolute';
				sidenav.style.top = 0;
				sidenav.classList.add("unselectable");
				sidenav.classList.add("sidenav");

				var openButton = document.createElement('div');
				openButton.classList.add("unselectable");
				openButton.classList.add("openbtn");
				openButton.innerText = "☰";
				openButton.addEventListener("click", openSideBar);
				element.appendChild(openButton);

				var closeButton = document.createElement('div');
				closeButton.className = "closebtn";
				closeButton.innerText = "✕";
				closeButton.addEventListener("click", closeSideBar);
				sidenav.appendChild(closeButton);

				var notes = document.createElement('div');
				notes.innerText = "Select Color Source:"
				notes.classList.add("setting");
				notes.classList.add("light");
				sidenav.appendChild(notes);

				//Create dropdown
				var selector = document.createElement("SELECT");
				var variableNames = Object.keys(x.data);
				for(let i=0; i<variableNames.length; i++){
					var option = document.createElement("option");
					option.setAttribute("value", variableNames[i]);
					option.innerHTML = variableNames[i];
					selector.appendChild(option);
				}
				
				//Add listener to dropdown
				selector.addEventListener("change", function(event) {
					updateColours(event.target.value);
				});
				selector.classList.add("setting");

				//Add dropdown to sidebar
				sidenav.appendChild(selector);
				sidenav.appendChild(document.createElement("br"));

				//Create group to store graph 
				var graph = new THREE.Group();

				//Parse and meshify nodes
				var nodes = new Array(x.mapper.num_vertices);
				for(let i=0; i<nodes.length; i++) {
					var radius = MIN_RADIUS + x.mapper.points_in_vertex[i].length / x.data[variableNames[0]].length * (MAX_RADIUS - MIN_RADIUS);
					var circleGeom = new THREE.CircleGeometry(radius, 32);
					var circleMat = new THREE.MeshBasicMaterial();
					nodes[i] = new node(i, x.mapper.level_of_vertex[i], x.mapper.points_in_vertex[i], radius, circleGeom, circleMat);
					graph.add(nodes[i]);
			
					var nodeDiv = document.createElement('div');
					nodeDiv.classList.add('unselectable');
					nodeDiv.classList.add('label');
					nodeDiv.classList.add('nlabel');
					nodeDiv.textContent = 'Node ' + i;

					var nodeLabel = new THREE.CSS2DObject(nodeDiv);
					nodeLabel.position.set(0, radius+7, 0);
					nodes[i].add(nodeLabel);
				}
			
				//Preface for node label selection dropdown
				var labelChoice = document.createElement('div');
				labelChoice.innerText = "Node label as:";
				labelChoice.classList.add("setting");
				labelChoice.classList.add("light");
				sidenav.appendChild(labelChoice);

				//Create node label dropdown
				var labelSelector = document.createElement("SELECT");
				var optionName = document.createElement("option");
				var optionSize = document.createElement("option");
				optionName.setAttribute("value", "name");
				optionSize.setAttribute("value", "size");
				optionName.innerHTML = "Name";
				optionSize.innerHTML = "Size";
				labelSelector.appendChild(optionName);
				labelSelector.appendChild(optionSize);

				//Add listener to dropdown
				labelSelector.addEventListener("change", function(event) {
					if(event.target.value == "size") {
						for(let i=0; i<nodes.length; i++) {
							if(i==5) console.log(nodes[i]);
							nodes[i].children[0].element.innerHTML = x.mapper.points_in_vertex[i].length;
							if(i==5) console.log(nodes[i]);
						}
					} else {
						for(let i=0; i<nodes.length; i++) {
							nodes[i].children[0].element.innerHTML = 'Node ' + i;
						}
					}
				});
				labelSelector.classList.add("setting");

				//Add dropdown to sidebar
				sidenav.appendChild(labelSelector);
				sidenav.appendChild(document.createElement('br'));

				//Create export button and dropdown
				var button = document.createElement("a");
				button.setAttribute("class", "button");
				button.setAttribute("value", "Export Graph");
				button.innerHTML = "Export Graph";
				var selectorExport = document.createElement("SELECT");
				selectorExport.setAttribute("id", "selectorExport");
				var optionJPEG = document.createElement("option");
				var optionPNG = document.createElement("option");
				optionJPEG.setAttribute("value", "JPEG");
				optionPNG.setAttribute("value", "PNG");
				optionJPEG.innerHTML = "JPEG";
				optionPNG.innerHTML = "PNG";
				selectorExport.appendChild(optionJPEG);
				selectorExport.appendChild(optionPNG);

				//Add listener to button
				button.addEventListener("click", function() {
					html2canvas(exportDiv, {
						width: width,
						height: height
					}).then(function(canvas) {
							var imgtype = selectorExport.options[selectorExport.selectedIndex].value.toLowerCase();
							var imgdata = canvas.toDataURL("image/" + imgtype.toLowerCase());
							imgdata = imgdata.replace(/^data:image\/[^;]*/, 'data:application/octet-stream');
							imgdata = imgdata.replace(/^data:application\/octet-stream/, 'data:application/octet-stream;headers=Content-Disposition%3A%20attachment%3B%20filename=Canvas.png');
							button.setAttribute("download", "graph." + imgtype);
							button.setAttribute("href", imgdata);
						}
					);
				});

				//Add button and dropdown to sidebar
				button.classList.add("setting");
				button.classList.add("light");
				selectorExport.className = "setting";
				sidenav.appendChild(button);
				sidenav.appendChild(selectorExport);
				sidenav.appendChild(document.createElement("br"));

				var tableTitle = document.createElement("div");
				tableTitle.innerText = "Selected Node:"
				tableTitle.classList.add("setting");
				tableTitle.classList.add("light");
				sidenav.appendChild(tableTitle);
				
				

				

				/*	
					CODE FOR PARSING AND MESHIFYING NODES WAS HERE.
					I MOVED IT UP, BEFORE THE IMPLEMENTATION OF THE
					NODE CUSTOMIZATION UI, BECAUSE I NEEDED TO
					REFERENCE THE GRAPH AND NODES[] VARIABLES. WE
					SHOULD PROBABLY CATEGORISE OUR CODE FOR EASY
					ACCESS/LOOKUP, SINCE IT'S 1 BILLION LINES LONG.
				*/




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

				//Create table
				table = document.createElement("table");
				table.style.display = "none";
				//Add header
				var tr = table.insertRow(0);
				for(var i=0; i<variableNames.length; i++) {
					var headerCell = document.createElement('th');
					headerCell.innerHTML = "<b>"+variableNames[i]+"</b>";
					headerCell.style.border = "1px solid";
					headerCell.style.textAlign = "center";
					tr.appendChild(headerCell);
				}
				
				//Find max points
				var max = 0;
				for(var i=0; i<nodes.length; i++) {
					if(nodes[i].points.length > max) {
						max = nodes[i].points.length;
					}
				}
				
				//Create hidden rows
				var rows = new Array(max);
				for(var i=0; i<max; i++) {
					var row = table.insertRow(i+1);
					rows[i] = row;
					row.style.display = "none";
					for(var j=0; j<variableNames.length; j++) {
						var cell = row.insertCell(j);
						cell.style.border = "1px solid";
					}
				}
				sidenav.appendChild(table);

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
					colMesh.position.set(i * legendColumnWidth - legendWidth, legendHeight/2, 0);
					legend.add(colMesh);
				}

				//Add legend labels
				var minDiv = document.createElement('div');
				var maxDiv = document.createElement('div');
				minDiv.classList.add('unselectable');
				minDiv.classList.add('label');
				maxDiv.classList.add('unselectable');
				maxDiv.classList.add('label');
				var minLabel = new THREE.CSS2DObject(minDiv);
				minLabel.position.set(-legendWidth, -10, 0);
				var maxLabel = new THREE.CSS2DObject(maxDiv);
				maxLabel.position.set(0, -10, 0);
				legend.add(minLabel);
				legend.add(maxLabel);

				hudScene.add(legend);
				legend.position.set(width - 50, -height + 50, 1);

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
					node.material.color.add(selectedColor);
					table.style.display = "";
					for(var i=0; i<node.points.length; i++) {
						var row = rows[i];
						row.style.display = "";
						for(var j=0; j<variableNames.length; j++) {
							row.cells[j].innerHTML = x.data[variableNames[j]][node.points[i]-1].toFixed(2);
						}
					}
					/*
					TODOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO
					OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO
					OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO
					OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO
					OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO
					OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO
					OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO
					OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO
					OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO
					OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO
					OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO
					OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO
					OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO
					OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO
					OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO
					OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO
					OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO
					OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO
					OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO
					OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO
					OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO
					OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO
					OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO
					OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO
					OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO
					OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO
					OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO
					OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO
					OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO
					
					var nodeSize = new document.createElement('div');
					nodeSize.classList.add('unselectable');
					nodeSize.classList.add('label');
					nodeSize.classList.add('nlabel');
					nodeSize.textContent = node.points.length;

					var nodeSizeLabel = new THREE.CSS2DObject(nodeSize);
					nodeSizeLabel.position.set(0, 0, 0);
					*/
					openSideBar();
				}

				function onNodeDeselect(node) {
					node.material.color.sub(selectedColor);
					table.style.display = "none";
					for(var i=0; i<node.points.length; i++) {
						rows[i].style.display = "none";
					}
				}
				
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
				}

				function mouseUp(event) {
					var prevSelected = selected;
					if(prevSelected && isMouseDown) {
						onNodeDeselect(selected);
						selected = null;
					}
					
					if(isMouseDown) {
						if(mouse.distanceTo(mouseStart) < 1) {
							if(over && (!prevSelected || (prevSelected.id != over.id))) {
								selected = over;
								onNodeSelect(over);
							}
						}
						if(over) onNodeDragEnd(over);
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
				element.addEventListener('mouseleave', mouseUp);
				element.addEventListener('wheel', mouseZoom);

				function block(event) {
					event.stopPropagation();
				}


				sidenav.addEventListener('mousedown', block);
				sidenav.addEventListener('mousemove', block);
				sidenav.addEventListener('mouseup', block);
				sidenav.addEventListener('wheel', block);
				sidenav.addEventListener('mouseenter', mouseUp);
			},
			
			resize: function(width, height) {
				var aspect = width / height;
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