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

				//Add mouse listners
				document.body.addEventListener("mousedown", function(event) {
					//Convert mouse coordinates to scene vector
					var elem = renderer.domElement;
					var boundingRect = elem.getBoundingClientRect();
					var x = (event.clientX - boundingRect.left) * (elem.width / boundingRect.width);
					var y = (event.clientY - boundingRect.top) * (elem.height / boundingRect.height);
					var vector = new THREE.Vector3(( x / width ) * 2 - 1, - ( y / height ) * 2 + 1, 0);
					vector.unproject(camera);

					//Create circle at coordinates
					var geometry = new THREE.CircleGeometry(50, 32);
					var material = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
					var circle = new THREE.Mesh( geometry, material );
					circle.position.set(vector.x, vector.y, vector.z);
					scene.add(circle);
				}, false);

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