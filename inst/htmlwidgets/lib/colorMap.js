//Legend constants
const cols = 20;
const width = 500;
const height = 50;
const gap = 0.25;
const animTime = 0.5;

class ColorMap extends THREE.Group {
    constructor(mapName = 'rainbow', n = 256) {
		super();
		this.clock = new THREE.Clock(false);
        this.n = n;
        this.material = new THREE.MeshBasicMaterial(); 
		this.table = new Array(this.n).fill(null);

		this.material.map = new THREE.DataTexture(new Uint8Array(3 * this.n).fill(0), this.n, 1, THREE.RGBFormat);
		this.material.magFilter = this.material.minFilter = THREE.NearestFilter;
		
		//Event system for updating materials
		this.eventSystem = new event();

        //Set map and material texture
        this.changeColorMapByName(mapName);

        //Create legend
        let columnWidth = width / cols;
        let scaledColumnWidth = columnWidth * gap;
        for(let i=0; i<cols; i++) {
			var geometry = new THREE.PlaneGeometry(scaledColumnWidth, 1, 1);
            geometry.faceVertexUvs[0][0][0] = geometry.faceVertexUvs[0][0][1] = geometry.faceVertexUvs[0][1][0] = new THREE.Vector2(i/(cols+1), 1);
			geometry.faceVertexUvs[0][0][2] = geometry.faceVertexUvs[0][1][1] = geometry.faceVertexUvs[0][1][2] = new THREE.Vector2((i+1)/(cols+1), 1);
			var mesh = new THREE.Mesh(geometry, this.material);
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

	changeColorMap(map) {
		var step = 1.0 / this.n;
        var index = 0;
        var stride = 0;
		var data = this.material.map.image.data;
		for(var i = 0; i <= 1; i += step) {
			for(var j = 0; j < map.length-1; ++j) {
				if(i >= map[j][0] && i < map[j+1][0]) {
					var min = map[j][0];
					var max = map[j+1][0];
					var minColor = new THREE.Color(0xffffff).setHex(map[j][1]);
					var maxColor = new THREE.Color(0xffffff).setHex(map[j+1][1]);
					var color = minColor.lerp(maxColor, (i-min)/(max-min));
					data[stride++] = Math.round(color.r * 255.0);
					data[stride++] = Math.round(color.g * 255.0);
					data[stride++] = Math.round(color.b * 255.0);
                    this.table[index++] = color; 
				}
			}
		}
		this.material.map.needsUpdate = true;
		this.material.needsUpdate = true;
		this.eventSystem.invokeEvent("onUpdate");
	}

	changeColorMapByName(mapName) {
		this.changeColorMap(ColorMapKeywords[mapName]);
	}

	getColorByValue(value, min, max) {
		return this.table[this.getUByValue(value, min, max) * (this.n - 1)];
    }
    
    //Gets U component of UV coordinates
    getUByValue(value, min, max) {
        return Math.round((value - min)/(max - min));
    }

	getTexture() {
		return this.material.map;
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
};

ColorMapKeywords = {
	"rainbow": [[ 0.0, '0x0000FF' ], [ 0.2, '0x00FFFF' ], [ 0.5, '0x00FF00' ], [ 0.8, '0xFFFF00' ], [ 1.0, '0xFF0000' ]],
	"cooltowarm": [[ 0.0, '0x3C4EC2' ], [ 0.2, '0x9BBCFF' ], [ 0.5, '0xDCDCDC' ], [ 0.8, '0xF6A385' ], [ 1.0, '0xB40426' ]],
	"blackbody": [[ 0.0, '0x000000' ], [ 0.2, '0x780000' ], [ 0.5, '0xE63200' ], [ 0.8, '0xFFFF00' ], [ 1.0, '0xFFFFFF' ]],
	"grayscale": [[ 0.0, '0x000000' ], [ 0.2, '0x404040' ], [ 0.5, '0x7F7F80' ], [ 0.8, '0xBFBFBF' ], [ 1.0, '0xFFFFFF' ]]
};