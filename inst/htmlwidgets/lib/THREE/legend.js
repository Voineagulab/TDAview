//Legend constants
const cols = 20;
const width = 300;
const height = 100;
const gap = 0.25;

module.exports = class Legend extends THREE.Group {
    constructor(mapName = 'rainbow', n = 256) {
        this.n = n;
        this.material = new THREE.MeshBasicMaterial(); 
        this.table = new Array(this.n).fill(null);

        //Set lut and material texture
        this.changeColorMap(mapName);

        //Create legend
        let columnWidth = width * gap;
        let scaledColumnWidth = columnWidth * gap;
        for(let i=0; i<legendColumns; i++) {
            var colGeom = new THREE.PlaneGeometry(scaledColumnWidth, 1, 1);
            colGeom.faceVertexUvs[0][0][0] = colGeom.faceVertexUvs[0][0][2] = colGeom.faceVertexUvs[0][1][0] = new THREE.Vector2(i/cols, 0);
            colGeom.faceVertexUvs[0][0][3] = colGeom.faceVertexUvs[0][1][2] = colGeom.faceVertexUvs[0][1][3] = new THREE.Vector2(i/cols + scaledColumnWidth/width, 0);
            var colMesh = new THREE.Mesh(colGeom, this.material);
            colMesh.position.set(i * columnWidth - width, height/2, 0);
            this.add(colMesh);
        }

		//Create legend labels
		var minDiv = document.createElement('div');
		var maxDiv = document.createElement('div');
		minDiv.className = maxDiv.className = "unselectable label";
		this.minLabel = new THREE.CSS2DObject(minDiv);
		this.maxLabel = new THREE.CSS2DObject(maxDiv);
		minLabel.position.set(-legendWidth, -10, 0);
		maxLabel.position.set(0, -10, 0);
		this.add(minLabel);
		this.add(maxLabel);
	}

	changeColorMap(mapName) {
		var step = 1.0 / this.n;
        var index = 0;
        var stride = 0;
		var map = ColorMapKeywords[mapName]
		var data = new Uint8Array(3 * this.n);
		for(var i = 0; i <= 1; i += step) {
			for(var j = 0; j < map.length-1; ++j) {
				if(i >= map[j][0] && i < map[j+1][0]) {
					var min = map[j][0];
					var max = map[j+1][0];
					var minColor = new THREE.Color(0xffffff).setHex(map[j][1]);
					var maxColor = new THREE.Color(0xffffff).setHex(map[j+1][1]);
					var color = minColor.lerp(maxColor, (i-min)/(max-min));
					data[stride++] = color.r;
					data[stride++] = color.g;
                    data[stride++] = color.b;
                    this.table[index++] = color; 
				}
			}
		}
		this.material.map = new THREE.DataTexture(data, this.n, 1, THREE.RGBFormat);
		this.material.needsUpdate = true;
	}

	getColorByValue(value, min, max) {
		return this.table[this.getUByValue(value, min, max) * (this.n - 1)];
    }
    
    //Gets U component of UV coordinates
    getUByValue(value, min, max) {
        return Math.round((value - min)/(max - min));
    }

	getMaterial() {
		return this.material;
	}

    getLegendCols() {
        return cols;
    }

	setLegendColHeights(heights, min, max) {
		for(let i=0; i<cols; i++) {
			let h = (Math.round((heights[i] - min)/(max - min)) * (height - 1));
			this.children[i].scale.y = h;
			this.children[i].position.setY(h/2);
		}
	}

	setLegendLabels(min, max) {
		this.minLabel.element.textContent = min;
		this.maxLabel.element.textContent = max;
    }
};

ColorMapKeywords = {
	"rainbow": [[ 0.0, '0x0000FF' ], [ 0.2, '0x00FFFF' ], [ 0.5, '0x00FF00' ], [ 0.8, '0xFFFF00' ], [ 1.0, '0xFF0000' ]],
	"cooltowarm": [[ 0.0, '0x3C4EC2' ], [ 0.2, '0x9BBCFF' ], [ 0.5, '0xDCDCDC' ], [ 0.8, '0xF6A385' ], [ 1.0, '0xB40426' ]],
	"blackbody": [[ 0.0, '0x000000' ], [ 0.2, '0x780000' ], [ 0.5, '0xE63200' ], [ 0.8, '0xFFFF00' ], [ 1.0, '0xFFFFFF' ]],
	"grayscale": [[ 0.0, '0x000000' ], [ 0.2, '0x404040' ], [ 0.5, '0x7F7F80' ], [ 0.8, '0xBFBFBF' ], [ 1.0, '0xFFFFFF' ]]
};