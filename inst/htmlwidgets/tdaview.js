HTMLWidgets.widget({
	name: 'tdaview',
	type: 'output',
	
	factory: function(element, width, height) {
		var camera, hudCamera, aspect;
		var renderer, labelRenderer;
		var frustumSize = 1000;

		var map;
		var graph;
		
		return {
			renderValue: function(x) {
				//Overwrite with random data
				/*
				x.mapper.num_vertices = 100;
				var adjacency = new Array(x.mapper.num_vertices);
				for(let i=0; i<adjacency.length; i++) {
					adjacency[i] = new Array(x.mapper.num_vertices);
					for(let j=0; j<adjacency[i].length; j++) {
						adjacency[i][j] = Math.round(Math.random()*0.5125);
					}
				}
				x.mapper.adjacency = adjacency;
				*/
				
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

				var exportDiv = document.createElement('div');
				exportDiv.setAttribute("id", "export");
				element.appendChild(exportDiv);

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
				labelRenderer.domElement.style.position = 'absolute';
				labelRenderer.domElement.style.top = 0;
				labelRenderer.domElement.setAttribute("id", "labelcanvas");

				//Add to DOM
				exportDiv.appendChild(renderer.domElement);
				exportDiv.appendChild(labelRenderer.domElement);

				//Mouse utility function
				var mouseWorld = new THREE.Vector3();
				function mouseToWorld(mouse) {
					mouse.x -= 250;
					var size = renderer.getSize();
					mouseWorld.x = mouse.x / size.width * 2 - 1;
					mouseWorld.y = - mouse.y / size.height * 2 + 1;
					mouseWorld.z = 0;
					mouseWorld.unproject(camera);
					return mouseWorld;
				}

				//Parse mapper into data objects
				var bins = new Array(x.mapper.num_vertices);
				for(let i=0; i<bins.length; i++) {
					bins[i] = new bin(x.mapper.level_of_vertex[i], x.mapper.points_in_vertex[i]);
				}

				//Calculate normalised means for each meta var
				var metaVars = Object.keys(x.data);
				for(let i=0; i<metaVars.length; i++) {
					var max = -Infinity;
					var min = Infinity;
					for(let j=0; j<x.data[metaVars[i]].length; j++) {
						var val = x.data[metaVars[i]][j];
						if(val > max) max = val;
						if(val < min) min = val;
					}
					
					for(let j=0; j<x.mapper.num_vertices; j++) {
						var sum = 0;
						var count = x.mapper.points_in_vertex[j].length;
						for(let k=0; k<count; k++) {
							sum += x.data[metaVars[i]][x.mapper.points_in_vertex[j][k]-1];
						}
						bins[j].mean[metaVars[i]] = (sum/count - min)/(max - min);
					}
				}

				map = new ColorMap('rainbow', 256);
				hudScene.add(map);
				map.position.set(width - 10, -height + 10, 1);

				//Give it random heights
				let heights = new Array(map.getLegendCols());
				for(let i=0; i<heights.length; i++) {
					heights[i] = Math.random();
				}
				map.setLegendColHeights(heights, 0, 1);
				
				graph = new forceGraph(bins, x.mapper.adjacency, map, exportDiv, mouseToWorld);
				scene.add(graph);

				//Menu creation
				var sidebar = new menu(graph, element, metaVars);
				sidebar.nodeGradPicker.eventSystem.addEventListener("onColorChange", function(color) {
					map.changeColorMap([[0.0, "0x" + color], [1.0, "0x" + color]]);
					requestAnimationFrame(render);
				});

				sidebar.nodeGradPicker.eventSystem.addEventListener("onGradientChange", function(steps) {
					//Parses step format into colormap array format and adds start/end steps. 
					//TODO: Better to share base class (gradientPicker can extend it to include "element")
					var array = new Array(steps.length+2);
					array[0] = [0.0, "0x" + steps[0].color];
					array[array.length-1] = [1.0, "0x" + steps[steps.length-1].color];
					for(let i=0; i<steps.length; i++) {
						array[i+1] = [steps[i].percentage/100, "0x" + steps[i].color];
					}
					map.changeColorMap(array);
					requestAnimationFrame(render);
				});

				sidebar.eventSystem.addEventListener("onColorMetaChange", function(checked, count) {
					switch(count) {
						
						case 0: {
							sidebar.nodeGradPicker.setStateSingle();
							//Set link colors
							for(let i=0; i<graph.links.length; i++) {
								graph.links[i].setColor(0.5);
								graph.links[i].updateColor();
							}
							break;
						}
						case 1: {
							sidebar.nodeGradPicker.setStateGradient();
							var meta = Object.keys(checked).find(key => checked[key] === true);
							for(let i=0; i<graph.nodes.length; i++) {
								graph.nodes[i].setColor(graph.nodes[i].mean[meta]);
							}
							//Update link colors
							for(let i=0; i<graph.links.length; i++) {
								graph.links[i].setGradientFromNodes();
								graph.links[i].updateColor();
							}
							break;
						}
						default: {
							sidebar.nodeGradPicker.setStateFixedGradient(count);
							for(let i=0; i<graph.nodes.length; i++) {
								var sum = 0;
								var pie = new Array(metaVars.length);

								//TODO this uses ALL metavars, not checked
								//pass in array of ONLY checked instead rather than hash?
								for(let j=0; j<metaVars.length; j++) { 
									pie[j] = graph.nodes[i].mean[metaVars[j]];
									sum += pie[j];
								}
								for(let j=0; j<metaVars.length; j++) {
									pie[j] /= sum;
								}
								graph.nodes[i].setColorPie(pie);
							}

							//Update link colors
							for(let i=0; i<graph.links.length; i++) {
								graph.links[i].setGradientFromNodes();
								graph.links[i].updateColor();
							}
						}
					}
				});

				sidebar.eventSystem.addEventListener("onNodeSizeChange", function(checkedsize) {
					var sizeradios = document.forms["node-size-meta"].elements["nodesize"];
			        for(let i=0; i<sizeradios.length; i++) {
			            sizeradios[i].onclick = function() {
			            	console.log(checkedsize);
			            	console.log(this.value);
			                if(this.value == "none") {
			                    for(let i=0; i<graph.nodes.length; i++) {
			                        graph.nodes[i].setRadius(18);
			                        requestAnimationFrame(render);
			                        graph.link[i].setPositionFromNodes();
			                    }
			                } else if (this.value == "content") {
			                    for(let i=0; i<graph.nodes.length; i++) {
			                        graph.nodes[i].setRadius(graph.nodes[i].points.length);
			                        requestAnimationFrame(render);
			                        graph.link[i].setPositionFromNodes();
			                    }
			                } else {  //For metadata variables
			                    for(let j=0; j<metaVars.length; j++) {
			                        if(this.value == `${metaVars[j]}size`) {
			                            for(let i=0; i<graph.nodes.length; i++) {
			                                graph.nodes[i].setRadius(graph.nodes[i].mean[metaVars[j]]);
			                                requestAnimationFrame(render);
			                                graph.link[i].setPositionFromNodes();
			                            }
			                            console.log(`We have the meta-variable ${metaVars[j]}!`);
			                        }
			                    }
			                }
			            }
			            
			        }
				});
				

				scene.add(graph);

				//Set graph colors and node size
				for(let i=0; i<graph.nodes.length; i++) {
					graph.nodes[i].setColor(graph.nodes[i].mean["x"]);
					graph.nodes[i].setRadius(10 + Math.random() * 20);
				}
				graph.updateNodeColors();
				
				for(let i=0; i<graph.links.length; i++) {
					graph.links[i].setGradientFromNodes();
					graph.links[i].updateColor();
				}

				//Set graph listners
				graph.eventSystem.addEventListener("onTick", function() {
					if(graph.initiallizing) {
						var box = graph.getBoundingBox();
						camera.zoom = Math.min(width / (box.max.x - box.min.x), height / (box.max.y - box.min.y)) * 2;
						camera.updateProjectionMatrix();
					}
					requestAnimationFrame(render);
				});

				function render() {
					map.animate();
					renderer.clear();
					renderer.render(scene, camera);
					renderer.render(hudScene, hudCamera);
					labelRenderer.render(scene, camera);
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
		this.mean = {};
	}
}