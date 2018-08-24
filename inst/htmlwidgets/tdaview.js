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
				
				//Imported links not working - require "source" and "target" fields
				//var nodes = HTMLWidgets.dataframeToD3(x.nodes);
				//var links = HTMLWidgets.dataframeToD3(x.links);
				

				//Simple test data
				var nodes = [
					{ thing: 4 },
					{ thing: 3 },
					{ thing: 3 }
				];
				var links = [
					{ source: 0, target: 1 },
					{ source: 0, target: 2 }
				];

				//Create nodes
				var circleGeom = new THREE.CircleGeometry(10, 32);
				var circleMat = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
				for(var i=0; i<nodes.length; i++) {
					nodes[i].circle = new THREE.Mesh(circleGeom, circleMat);
					scene.add(nodes[i].circle);
				}

				//Create edges
				var lineMat = new THREE.LineBasicMaterial( { color: 0xff0000 } );
				for(let i=0; i<links.length; i++) {
					var lineGeom = new THREE.Geometry();
					lineGeom.vertices = [new THREE.Vector3(1000, 0, 0), new THREE.Vector3(0, 0, 0)];
					links[i].line = new THREE.Line(lineGeom, lineMat);
					scene.add(links[i].line);
				}
				
				//Start simulation loop
				var simulation = d3.forceSimulation(nodes)
				.force("link",  d3.forceLink(links).distance(50))
				.force('center', d3.forceCenter())
				.force("charge", d3.forceManyBody().strength(-30));
				simulation.on("tick", function () {
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

				//Start render loop
				function render() {
					requestAnimationFrame(render);
					renderer.render(scene, camera);
				}
				render();
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
