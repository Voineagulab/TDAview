

class Legend extends THREE.Group {
    constructor(colorMap) {
        super();
        this.clock = new THREE.Clock(false);
        let columnWidth = width / cols;
        let scaledColumnWidth = columnWidth * gap;
        for(let i=0; i<cols; i++) {
			var geometry = new THREE.PlaneGeometry(scaledColumnWidth, 1, 1);
            geometry.faceVertexUvs[0][0][0] = geometry.faceVertexUvs[0][0][1] = geometry.faceVertexUvs[0][1][0] = new THREE.Vector2(i/(cols+1), 1);
			geometry.faceVertexUvs[0][0][2] = geometry.faceVertexUvs[0][1][1] = geometry.faceVertexUvs[0][1][2] = new THREE.Vector2((i+1)/(cols+1), 1);
			var mesh = new THREE.Mesh(geometry, colorMap.material);
            mesh.position.set(i * columnWidth - width, height/2, 0);
            this.add(mesh);
        }

		//Create legend labels
		var minDiv = document.createElement('div');
		var maxDiv = document.createElement('div');
		minDiv.className = maxDiv.className = "unselectable label";
		this.minLabel = new THREE.CSS2DObject(minDiv);
		this.maxLabel = new THREE.CSS2DObject(maxDiv);
		this.minLabel.position.set(-width, -10, 0);
		this.maxLabel.position.set(0, -10, 0);
		this.add(this.minLabel);
		this.add(this.maxLabel);
    }

    getLegendCols() {
        return cols;
    }

	setLegendColHeights(heights, min, max) {
		this.clock.start();
		for(let i=0; i<cols; i++) {
			let h = (heights[i] - min)/(max - min) * height;
			this.children[i].scale.y = h;
			this.children[i].position.setY(h/2);
		}
	}

	setLegendLabels(min, max) {
		this.minLabel.element.textContent = min;
		this.maxLabel.element.textContent = max;
    }
    
    animate() {
		if(this.clock.running) {
			if(this.clock.elapsedTime > animTime) {
				this.clock.stop();
			} else {
				this.scale.y = THREE.Math.smoothstep(this.clock.getElapsedTime()/animTime, 0.0, 1.0);
			}
		}
	}
}