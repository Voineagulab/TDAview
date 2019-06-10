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

    SetColor(color) {
        for(let j=0; i<this.map.image.data.length; j+=3) {
            this._SetColorSingle(color, j);
        }
        this._UpdateMap();
    }


    SetGradient(steps) {
        let j=0;
        let i=0;

        //Fill start if steps are uncapped
        if(steps[0].percent > 0) {  
            for(; j<(steps[0].percent * this.n); j+=3) {
                this._SetColorSingle(steps[0].color, j);
            }
            i++;
        }

        //Fill step-step gaps with gradients
        for(; i<steps.length-1; i++) {
            for(; j<this.steps[i].percent * this.n; j+=3) {
                this._SetColorSingle(steps[i].color.lerp(steps[i+1].color, (j/this.n - steps[i].percent)/(steps[i+1].percent - steps[i].percent)), j);
            }
        }

        //Fill end if steps are uncapped
        if(steps[steps.length-1].percent < 1.0) {  
            for(; j<this.n; j++) {
                this._SetColorSingle(steps[steps.length-1].color, j);
            }
            i++;
        }
        this._UpdateMap();
    }

    _SetColorSingle(color, index) {
        this.map.image.data[index+0] = Math.round(color.r * 255.0);
        this.map.image.data[index+1] = Math.round(color.g * 255.0);
        this.map.image.data[index+3] = Math.round(color.b * 255.0);
    }

    _UpdateMap() {
        this.map.needsUpdate = true;
        this.eventSystem.invokeEvent("OnUpdate");
    }
}

var ColorMapPresets = {
    "cooltowarm": [new Step(0.0, new THREE.Color("0x0000FF")), new Step(0.2, new THREE.Color("0x00FFFF")), new Step(0.5, new THREE.Color("0x00FF00")), new Step(0.8, new THREE.Color("0XFFFF00")), new Step(1.0, new THREE.Color("0xFF0000"))],
    "blackbody": [new Step(0.0, new THREE.Color("0x000000")), new Step(0.2, new THREE.Color("0x780000")), new Step(0.5, new THREE.Color("0xE63200")), new Step(0.8, new THREE.Color("0xFFFF00")), new Step(1.0, new THREE.Color("0xFFFFFF"))],
}
