HTMLWidgets.widget({
	name: 'tdaview',
	type: 'output',
	
	factory: function(element, width, height) {
		var camera, hudCamera, aspect;
		var renderer, labelRenderer;
		var frustumSize = 1000;
		
		return {
			renderValue: function(x) {
				//Update aspect
				aspect = width / height;

				//Create cameras
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
				renderer.setClearColor(0x000000, 0);
				renderer.autoClear = false;
				labelRenderer = new THREE.CSS2DRenderer();
				labelRenderer.setSize(width, height);
				labelRenderer.domElement.style.position = 'absolute';
				labelRenderer.domElement.style.top = 0;

				//Add to DOM
				element.appendChild(renderer.domElement);
				element.appendChild(labelRenderer.domElement);

				//Parse mapper into data objects
				var bins = new Array(x.mapper.num_vertices);
				for(let i=0; i<bins.length; i++) {
					bins[i] = new bin(x.mapper.level_of_vertex[i], x.mapper.points_in_vertex[i]);
				}

				var map = new ColorMap();
				scene.add(map);
				map.position.set(width - 10, -height + 10, 1);

				//Give it random heights
				let heights = new Array(map.getLegendCols());
				for(let i=0; i<heights.length; i++) {
					heights[i] = Math.random();
				}
				map.setLegendColHeights(heights, 0, 1);
				
				var graph = new forceGraph(bins, x.mapper.adjacency, map.getTexture());
				scene.add(graph);

				//Set graph colors
				for(let i=0; i<graph.nodes.length; i++) {
					graph.nodes[i].setColor(Math.random());
					graph.nodes[i].setRadius(10 + Math.random() * 20);
				}
				graph.updateNodeColors();
				graph.updateNodeScales();

				
				for(let i=0; i<graph.links.length; i++) {
					graph.links[i].setGradientFromNodes();
					graph.links[i].updateColor();
				}

				graph.eventSystem.addEventListener("onTick", function() {
					requestAnimationFrame(render);
				});

				function render() {
					renderer.clear();
					renderer.render(scene, camera);
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
	
	
class bin {
	constructor(level, points) {
		this.level = level;
		this.points = points;
	}
}