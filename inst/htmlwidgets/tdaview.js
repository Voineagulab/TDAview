HTMLWidgets.widget({
	name: 'tdaview',
	type: 'output',

	factory: function(element, width, height) {
		var camera, scene, renderer, aspect;
		var frustumSize = 1000;

		return {
			renderValue: function(x) {
				aspect = width / height;
				camera = new THREE.OrthographicCamera(frustumSize*aspect/-2, frustumSize*aspect/2, frustumSize/2, frustumSize/-2, 1, 2000);
				camera.position.z = 400;
				scene = new THREE.Scene();
				scene.background = new THREE.Color(0xffffff);

				//Create renderer
				renderer = new THREE.WebGLRenderer({ antialias: true });
				renderer.setSize(width, height);
				element.appendChild(renderer.domElement);

				//Parse metadata variables
				var metaVars = Object.keys(x.data);
				var selectedMeta = 0;

				console.log(x.data);

				//Parse nodes and links from mapper
				var num = 0;
				var nodes = new Array(x.mapper.num_vertices);
				var links = new Array(Math.pow(x.mapper.num_vertices, 2));
				for(let i=0; i<x.mapper.num_vertices; i++) {
					nodes[i] = new node(x.mapper.level_of_vertex[i], x.mapper.points_in_vertex[i]);
					let row = x.mapper.adjacency[i];
					for(let j=0; j<x.mapper.num_vertices; j++) {
						if(row[j]) {
							links[num++] = new link(i, j);
						}
					}
				}
				links.length = num;

				//Create edge meshes
				var lineMat = new THREE.LineBasicMaterial( { color: 0xff0000 } );
				for(let i=0; i<links.length; i++) {
					var lineGeom = new THREE.Geometry();
					lineGeom.vertices = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0)];
					links[i].line = new THREE.Line(lineGeom, lineMat);
					scene.add(links[i].line);
				}
				
				//Find mean of selected metadata variable
				var means = new Array(nodes.length).fill(0);
				var min = Infinity;
				var max = -Infinity;
				for(var i=0; i<means.length; i++) {
					if(nodes[i].points.length) {
						for(var j=0; j<nodes[i].points.length; j++) {
							var point = x.data[metaVars[selectedMeta]][nodes[i].points[j]-1]; //WARNING: 1-INDEXED
							if(point < min) min = point;
							if(point > max) max = point;
							means[i] += point;
							console.log(point);
						}
						means[i] /= nodes[i].points.length;
					}
					
				}

				//Normalise means
				for(var i=0; i<means.length; i++) {
					means[i] = (means[i] + min) / (min - max);
				}

				//Create node meshes coloured by mean
				var circleGeom = new THREE.CircleGeometry(10, 32);
				for(var i=0; i<nodes.length; i++) {
					var circleMat = new THREE.MeshBasicMaterial( { color: "hsl(" + means[i] * 100 + ", 100%, 50%)" } );
					nodes[i].circle = new THREE.Mesh(circleGeom, circleMat);
					scene.add(nodes[i].circle);
				}

				//Start simulation loop
				var simulation = d3.forceSimulation(nodes)
				.force("link",  d3.forceLink(links).distance(50))
				.force('center', d3.forceCenter())
				.force("charge", d3.forceManyBody().strength(-30));
				simulation.on("tick", function () {
					requestAnimationFrame(render);
                    for(var i=0; i<links.length; i++) {
						var source = links[i].source;
						var target = links[i].target;
						var line = links[i].line;
						line.geometry.vertices[0].x = source.circle.position.x = source.x;
						line.geometry.vertices[0].y = source.circle.position.y = source.y;
						line.geometry.vertices[1].x = target.circle.position.x = target.x;
						line.geometry.vertices[1].y = target.circle.position.y = target.y;
						line.geometry.verticesNeedUpdate = true;
					}
				});

				//Render on tick
				function render() {
					renderer.render(scene, camera);
				}
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


class node {
	constructor(level, points) {
		this.level = level;
		this.points = points;
	}
}

class link {
	constructor(source, target) {
		this.source = source;
		this.target = target;
	}
}