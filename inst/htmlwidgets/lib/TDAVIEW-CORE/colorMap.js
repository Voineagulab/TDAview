class ColorMap {
    constructor(mapName = 'rainbow', n = 256) {
        this.n = n;
        this.material = new THREE.MeshBasicMaterial(); 
		this.table = new Array(this.n).fill(null);

		this.material.map = new THREE.DataTexture(new Uint8Array(3 * this.n).fill(0), this.n, 1, THREE.RGBFormat);
		
		//Event system for updating materials
		this.eventSystem = new event();

        //Set map and material texture
        this.changeColorMapByName(mapName);
	}

	changeColor(color) {
		var data = this.material.map.image.data;
		var colorHex = new THREE.Color().setHex("0x" + color);
		for(let i=0; i<data.length;) {
			data[i++] = Math.round(colorHex.r * 255.0);
			data[i++] = Math.round(colorHex.g * 255.0);
			data[i++] = Math.round(colorHex.b * 255.0);
		}
		this.material.map.needsUpdate = true;
		this.material.needsUpdate = true;
		this.eventSystem.invokeEvent("onUpdate");
	}

	changeColorMap(steps) {
		/*
		var step = 1.0 / this.n;
		var index = 0;
		var stride = 0;
		var data = this.material.map.image.data;

		var currPer = steps[0].percentage/100.0;
		var nextPer = steps[0].percentage/100.0;
		var currStep = steps[0];
		var nextStep = steps[1];
		var currColor = new THREE.Color().setHex("0x" + currStep.color);
		var nextColor = new THREE.Color().setHex("0x" + nextStep.color);
		for(let i=1; i<=1; i+=step) {
			if(i <= next) {
				var color = currColor.lerp(nextColor, (i - currPer)/(nextPer - currPer));
			}
		}









		return;*/
		//Parse into array - should change to natively use steps
		var map = new Array(steps.length+2);
		map[0] = [0.0, "0x" + steps[0].color];
		map[map.length-1] = [1.0, "0x" + steps[steps.length-1].color];
		for(let i=0; i<steps.length; i++) {
			map[i+1] = [steps[i].percentage/100, "0x" + steps[i].color];
		}

		var step = 1.0 / this.n;
        var index = 0;
        var stride = 0;
		var data = this.material.map.image.data;
		for(var i = 0; i <= 1; i += step) {
			for(var j = 0; j < map.length-1; ++j) {
				if(i >= map[j][0] && i < map[j+1][0]) {
					var min = map[j][0];
					var max = map[j+1][0];
					var minColor = new THREE.Color().setHex(map[j][1]);
					var maxColor = new THREE.Color().setHex(map[j+1][1]);
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
};

ColorMapKeywords = {
	"rainbow": [[ 0.0, '0x0000FF' ], [ 0.2, '0x00FFFF' ], [ 0.5, '0x00FF00' ], [ 0.8, '0xFFFF00' ], [ 1.0, '0xFF0000' ]],
	"cooltowarm": [[ 0.0, '0x3C4EC2' ], [ 0.2, '0x9BBCFF' ], [ 0.5, '0xDCDCDC' ], [ 0.8, '0xF6A385' ], [ 1.0, '0xB40426' ]],
	"blackbody": [[ 0.0, '0x000000' ], [ 0.2, '0x780000' ], [ 0.5, '0xE63200' ], [ 0.8, '0xFFFF00' ], [ 1.0, '0xFFFFFF' ]],
	"grayscale": [[ 0.0, '0x000000' ], [ 0.2, '0x404040' ], [ 0.5, '0x7F7F80' ], [ 0.8, '0xBFBFBF' ], [ 1.0, '0xFFFFFF' ]]
};