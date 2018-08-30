HTMLWidgets.widget({
	name: 'tdaview',
	type: 'output',

	factory: function(element, width, height) {
		var camera, scene, renderer, aspect;
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

				//Create renderer
				renderer = new THREE.WebGLRenderer({ antialias: true });
				renderer.setSize(width, height);
				element.appendChild(renderer.domElement);

				/*
				var sidebar = document.getElementById("sidebar-controls");
				var text = document.createTextNode("This is new.");
				sidebar.appendChild(text);
				*/

				//Parse metadata variables
				var metaVars = Object.keys(x.data);
				var selectedMeta = 0;
				
				var x = document.createElement("SELECT");
				var op = new Option();
				op.value = 1;
				op.text = "X";
				x.options.add(op);
				x.setAttribute("id", "mySelect");
				document.body.appendChild(x);
				var z = document.createElement("option");
				z.setAttribute("value", "volvocar");
				var t = document.createTextNode("Option 1");
				z.appendChild(t);
				document.getElementById("mySelect");
				
				//Find mean of selected metadata variable
				var means = new Array(x.mapper.num_vertices).fill(0);
				var min = Infinity;
				var max = -Infinity;
				for(var i=0; i<means.length; i++) {
					if(x.mapper.points_in_vertex[i].length) {
						for(var j=0; j<x.mapper.points_in_vertex[i].length; j++) {
							var point = x.data[metaVars[selectedMeta]][x.mapper.points_in_vertex[i][j]-1]; //WARNING: 1-INDEXED
							if(point < min) min = point;
							if(point > max) max = point;
							means[i] += point;
						}
						means[i] /= x.mapper.points_in_vertex[i].length;
					}
				}

				//Normalise means
				for(var i=0; i<means.length; i++) {
					means[i] = (means[i] + min) / (min - max);
				}

				//Parse and meshify nodes
				var circleGeom = new THREE.CircleGeometry(10, 32);
				var nodes = new Array(x.mapper.num_vertices);
				for(let i=0; i<nodes.length; i++) {
					var circleMat = new THREE.MeshBasicMaterial( { color: "hsl(" + means[i] * 100 + ", 100%, 50%)" } );
					nodes[i] = new node(x.mapper.level_of_vertex[i], x.mapper.points_in_vertex[i], circleGeom, circleMat);
					scene.add(nodes[i]);
				}

				//Parse and meshify links
				var num = 0;
				var links = new Array(Math.pow(x.mapper.num_vertices, 2));
				var lineMat = new THREE.LineBasicMaterial( { color: 0xffffff } );
				for(let i=0; i<x.mapper.num_vertices; i++) {
					let row = x.mapper.adjacency[i];
					for(let j=0; j<x.mapper.num_vertices; j++) {
						if(row[j]) {
							var lineGeom = new THREE.Geometry();
							lineGeom.vertices = [new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 0, -1)];
							links[num] = new link(nodes[i], nodes[j], lineGeom, lineMat);
							scene.add(links[num]);
							++num;
						}
					}
				}

				//Truncate array
				links.length = num;

				//Start simulation loop
				var simulation = d3.forceSimulation(nodes)
				.force("link",  d3.forceLink(links).distance(30))
				.force('center', d3.forceCenter())
				.force("charge", d3.forceManyBody().strength(-100))
				.on("tick", function () {
					requestAnimationFrame(render);
                    for(var i=0; i<links.length; i++) {
						var source = links[i].source;
						var target = links[i].target;
						var line = links[i];
						line.geometry.vertices[0].x = source.position.x = source.x;
						line.geometry.vertices[0].y = source.position.y = source.y;
						line.geometry.vertices[1].x = target.position.x = target.x;
						line.geometry.vertices[1].y = target.position.y = target.y;
						line.geometry.verticesNeedUpdate = true;
					}
				});

				//Render (on simulation tick)
				function render() {
					renderer.render(scene, camera);
				}

				//Mouse events
				function mouseDown(event) {
					var elem = renderer.domElement
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
						var elem = renderer.domElement
						var boundingRect = elem.getBoundingClientRect();
						selected.fx = (+2 * (event.clientX - boundingRect.left) - width)/camera.zoom;
						selected.fy = (-2 * (event.clientY - boundingRect.top) + height)/camera.zoom;
						console.log(selected.fx);
					}
				}
				function mouseUp(event) {
					if(selected) {
						simulation.alphaTarget(0);
						selected = selected.fx = selected.fy = null;
					}
				}
				function mouseZoom(event) {
					requestAnimationFrame(render);
					camera.zoom -= event.deltaY * 0.001;
					camera.updateProjectionMatrix()
				}
				element.addEventListener('mousedown', mouseDown);
				element.addEventListener('mousemove', mouseMove);
				element.addEventListener('mouseup', mouseUp);
				element.addEventListener('wheel', mouseZoom);
			},

			resize: function(width, height) {
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
	constructor(level, points, geometry, material) {
		super(geometry, material);
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