HTMLWidgets.widget({
	name: 'tdaview',
	type: 'output',
	
	factory: function(element, width, height) {
		const MIN_RADIUS = 5, MAX_RADIUS = 50;
		var camera, scene, renderer, labelRenderer, aspect, cameraTween;
		var frustumSize = 1000;
		var raycaster = new THREE.Raycaster();
		var mouse = new THREE.Vector2();
		var selected = null;
		
		return {
			renderValue: function(x) {
				aspect = width / height;
				camera = new THREE.OrthographicCamera(frustumSize*aspect/-2, frustumSize*aspect/2, frustumSize/2, frustumSize/-2, 1, 2000);
				camera.position.z = 400;
				scene = new THREE.Scene();
				scene.background = new THREE.Color(0x4b515b);
		
				//Create graph renderer
				renderer = new THREE.WebGLRenderer({ antialias: true });
				renderer.setSize(width, height);
				element.appendChild(renderer.domElement);
		
				//Create label renderer
				labelRenderer = new THREE.CSS2DRenderer();
				labelRenderer.setSize(width, height);
				labelRenderer.domElement.style.position = 'absolute';
				labelRenderer.domElement.style.top = 0;
				element.appendChild(labelRenderer.domElement);

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
				notes.innerHTML = "<br><br>Notes:<br>-->\
									Node size is proportional to data contained.<br>-->\
									Node and edge colour is determined by metadata variables.";
				document.getElementById("sidebar-controls").appendChild(notes);

				//Create group to store graph 
				var graph = new THREE.Group();

				//Parse and meshify nodes
				var nodes = new Array(x.mapper.num_vertices);
				for(let i=0; i<nodes.length; i++) {
					var radius = MIN_RADIUS + x.mapper.points_in_vertex[i].length / x.data[metaVars[0]].length * (MAX_RADIUS - MIN_RADIUS);
					var circleGeom = new THREE.CircleGeometry(radius, 32);
					var circleMat = new THREE.MeshBasicMaterial();
					nodes[i] = new node(i, x.mapper.level_of_vertex[i], x.mapper.points_in_vertex[i], circleGeom, circleMat);
					graph.add(nodes[i]);
			
					var nodeDiv = document.createElement('div');
					nodeDiv.className = 'label';
					nodeDiv.textContent = 'Node ' + i;
					nodeDiv.style.marginTop = '-1em';
					nodeDiv.style.fontWeight = "100";
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
							var lineMat = new THREE.LineBasicMaterial( );
							var lineGeom = new THREE.Geometry();
							lineGeom.vertices = [new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 0, -1)];
							links[num] = new link(nodes[i], nodes[j], lineGeom, lineMat);
							graph.add(links[num]);
							++num;
						}
					}
				}
			
				//Truncate links array
				links.length = num;

				//Declare method for changing color by mean
				var lut = new THREE.Lut('rainbow', '1024');
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
						links[i].material.color = new THREE.Color(
							(links[i].source.material.color.r + links[i].target.material.color.r)/2, 
							(links[i].source.material.color.g + links[i].target.material.color.g)/2, 
							(links[i].source.material.color.b + links[i].target.material.color.b)/2);
						links[i].geometry.colorsNeedUpdate = true;
					}
					requestAnimationFrame(render);
				}

				scene.add(graph);

				//Set colours
				updateColours(Object.keys(x.data)[0]);
				
				//Start simulation loop
				var simulation = d3.forceSimulation(nodes)
				.force("link", d3.forceLink(links).distance(30))
				.force('center', d3.forceCenter())
				.force("charge", d3.forceManyBody().strength(-100))
				.on("tick", function () {
					requestAnimationFrame(render);
					for(var i=0; i<links.length; i++) {
						links[i].geometry.vertices[0].x = links[i].source.x;
						links[i].geometry.vertices[0].y = links[i].source.y;
						links[i].geometry.vertices[1].x = links[i].target.x;
						links[i].geometry.vertices[1].y = links[i].target.y;
						links[i].geometry.verticesNeedUpdate = true;
					}
					for(var i=0; i<nodes.length; i++) {
						nodes[i].position.x = nodes[i].x;
						nodes[i].position.y = nodes[i].y;
					}
				})
				.on("end", function() {
					var box = new THREE.Box3().setFromObject(graph);
					var zoomTarget = Math.min(width / (box.max.x - box.min.x + MAX_RADIUS), height / (box.max.y - box.min.y + MAX_RADIUS)) * 2;
					zoomCameraSmooth(zoomTarget, 1000);
				});

				function zoomCameraSmooth(zoomTarget, duration) {
					requestAnimationFrame(render);
					if(cameraTween) cameraTween.stop();
					cameraTween = new TWEEN.Tween({value: camera.zoom});
					cameraTween.to({value: zoomTarget}, duration);
					cameraTween.onUpdate(function() {
						requestAnimationFrame(render);
						camera.zoom = this.value;
						camera.updateProjectionMatrix();
					});
					cameraTween.easing(TWEEN.Easing.Quadratic.InOut);
					cameraTween.start();
				}
			
				//Render loop, called on simulation tick or zoom
				function render() {
					TWEEN.update()
					renderer.render(scene, camera);
					labelRenderer.render(scene, camera);
				}
				
				//Mouse events
				function mouseDown(event) {
					var elem = renderer.domElement;
					var boundingRect = elem.getBoundingClientRect();
					mouse.x = ((event.clientX - boundingRect.left) * (elem.width / boundingRect.width))/width * 2 - 1;
					mouse.y = -((event.clientY - boundingRect.top) * (elem.height / boundingRect.height))/height * 2 + 1;
					raycaster.setFromCamera(mouse, camera);
					var intersects = raycaster.intersectObjects(nodes, true);
					
					if(intersects.length > 0) {
						simulation.alphaTarget(0.3).restart();
						selected = intersects[0].object;
						mouseMove(event);
					}
				}
				function mouseMove(event) {
					if(selected) {
						var elem = renderer.domElement;
						var boundingRect = elem.getBoundingClientRect();
						selected.fx = (+2 * (event.clientX - boundingRect.left) - width)/camera.zoom;
						selected.fy = (-2 * (event.clientY - boundingRect.top) + height)/camera.zoom;
					}
				}

				function mouseUp(event) {
				if(selected) {
					simulation.alphaTarget(0);
					selected = selected.fx = selected.fy = null;
					}
				}

				function mouseZoom(event) {
					//camera.zoom -= event.deltaY * 0.001;
					zoomCameraSmooth(camera.zoom - event.deltaY * 0.005, 100);
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
	constructor(index, level, points, geometry, material) {
	super(geometry, material);
		this.index = index;
		this.level = level;
		this.points = points;
	}
}
	
class link extends THREE.Line {
	constructor(source, target, geometry, material) {
		super(geometry, material);
		this.source = source;
		this.target = target;
	}
}