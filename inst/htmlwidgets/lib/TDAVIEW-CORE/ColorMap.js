class ColorMap {
    constructor(n = 256) {
        this.n = n;
        this.map = new THREE.DataTexture(new Uint8Array(3 * this.n).fill(0), this.n, 1, THREE.RGBFormat);
        this.eventSystem = new event();
    }

    getTexture() {
        return this.map;
    }

    GetImageBase64() { //this is inefficient
        return this.map.image;
    }

    setColor(color) {
        this.steps = undefined;
        this.color = color;
        for(let j=0; j<this.n; j++) {
            this._SetColorSingle(color, j);
        }
        this._UpdateMap();
    }

    //TODO fix for > 2 steps
    getColor(percentage) { //this is more accurate than pixel interpolation
        if(this.color) {
            return this.color;
        } else {
            var ret = new THREE.Color();
            for(let i=0; i<this.steps.length-1; ++i) {
                if(percentage > this.steps[i].percentage) {
                    if(this.steps[i].percentage > this.steps[i+1].percentage) continue; 

                    ret.copy(this.steps[i].color);
                    ret.lerp(this.steps[i+1].color, (percentage - this.steps[i].percentage)/(this.steps[i+1].percentage - this.steps[i].percentage))
                    return ret;
                }
            }
            return this.steps[this.steps.length-1].color;
        }
    }

    setGradient(steps) {
        this.steps = steps;
        this.color = undefined;
        let j=0;
        let i=0;

        //Fill start if steps are uncapped
        if(steps[0].percentage > 0) {  
            for(; j<(steps[0].percentage * this.n); j++) {
                this._SetColorSingle(steps[0].color, j);
            }
        }
        
        //Fill step-step gaps with gradients
        let temp = new THREE.Color();
        for(; i<steps.length-1; i++) {
            for(; j<steps[i+1].percentage * this.n; j++) {
                temp.copy(steps[i].color);
                temp.lerp(steps[i+1].color, (j/this.n - steps[i].percentage)/(steps[i+1].percentage - steps[i].percentage));

                this._SetColorSingle(temp, j);
            }
        }

        //Fill end if steps are uncapped
        for(; j<this.n; j++) {
            this._SetColorSingle(steps[steps.length-1].color, j);
        }
        this._UpdateMap();

    }

    _SetColorSingle(color, index) {
        index *= 3;
        this.map.image.data[index+0] = Math.round(color.r * 255.0);
        this.map.image.data[index+1] = Math.round(color.g * 255.0);
        this.map.image.data[index+2] = Math.round(color.b * 255.0);
    }

    _UpdateMap() {
        this.map.needsUpdate = true;
        this.eventSystem.invokeEvent("OnUpdate");
    }
}

var ColorMapPresets = {
    "cooltowarm": [new Step(0.0, new THREE.Color("#0000FF")), new Step(0.2, new THREE.Color("#00FFFF")), new Step(0.5, new THREE.Color("#00FF00")), new Step(0.8, new THREE.Color("#FFFF00")), new Step(1.0, new THREE.Color("#FF0000"))],
    "blackbody": [new Step(0.0, new THREE.Color("#000000")), new Step(0.2, new THREE.Color("#780000")), new Step(0.5, new THREE.Color("#E63200")), new Step(0.8, new THREE.Color("#FFFF00")), new Step(1.0, new THREE.Color("#FFFFFF"))],
}
