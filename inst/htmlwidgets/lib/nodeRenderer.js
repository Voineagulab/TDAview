const MAX_NODE_SIZE = 8;
const MIN_NODE_SIZE = 2;

class NodeRenderer {
    constructor(colormap, nodes, parent, maxAttributes = 16, maxVaryings = 8) {
        this.slices = Math.min(maxAttributes-4, 2*maxVaryings-1);
        this.instance_count = nodes.length;

        this.material = new THREE.RawShaderMaterial({
            uniforms: {
                backgroundColor: {value: new THREE.Color()},
                nodeZoom: {value: 1.0},
                nodeAlpha: {value: 1.0},
                nodeTex: {value: colormap.getTexture() },
            },
            vertexShader: /*glsl*/`
                precision highp float;

                uniform mat4 modelViewMatrix;
                uniform mat4 projectionMatrix;
                uniform float nodeZoom;

                attribute vec2 position;
                attribute float scale;
                ${Array.from({ length: this.slices }, (_, i) => "attribute vec2 run" + i + ";").join('')}

                varying vec2 vPosition;
                ${Array.from({ length: this.slices }, (_, i) => "varying vec2 vRun" + i + ";").join('')}

                void main() {
                    vPosition = position;
                    ${Array.from({ length: this.slices }, (_, i) => "vRun" + i + " = run" + i + ";").join('')}

                    gl_PointSize = scale * nodeZoom;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4 (position, 0.0, 1.0);
                }`,
            fragmentShader: /*glsl*/`
                precision highp float;
                #define M_PI 3.1415926535897932384626433832795

                uniform sampler2D nodeTex;
                uniform float nodeAlpha;
                uniform vec3 backgroundColor;
            
                varying vec2 vPosition;
                ${Array.from({ length: this.slices }, (_, i) => "varying vec2 vRun" + i + ";").join('')}

                void main() {
                    vec2 cxy = 2.0 * gl_PointCoord - 1.0;
                    float r = dot(cxy, cxy);
                    if (r > 1.0) discard;
                
                    float pixelPercent = (1.0 + atan(cxy.x, cxy.y) / M_PI) / 2.0;

                    float u;
                    ${Array.from({ length: this.slices-1}, (_, i) => "if(vRun" + i + ".x>=pixelPercent){u=vRun" + i + ".y;}else{").join('')}
                    ${"u=vRun" + (this.slices-1) + ".y;" + "}".repeat(this.slices-1)}

                    gl_FragColor = vec4( mix( backgroundColor, texture2D( nodeTex, vec2 ( u , 1.0) ).xyz, nodeAlpha), 1.0);
                }`,
            side: THREE.BackSide,
            transparent: false,
        });

        //this.material.sizeAttenuation = true; this is for perspective cameras. Current x1.7 seems to depend on innerheight
        let geometry = new THREE.BufferGeometry();

        //Create paired attributes for pie slice run-length encoding
        for(let i=0; i<this.slices; i++) {
            let runVectors = new Float32Array(2 * this.instance_count).fill(Infinity);
            geometry.addAttribute("run" + i, new THREE.BufferAttribute(runVectors, 2));
        }

        //Initialise node scales
        let offsets = new Float32Array(2 * this.instance_count).fill(0.0);
        let scales = new Float32Array(this.instance_count).fill(1.0);
        geometry.addAttribute("scale", new THREE.BufferAttribute(scales, 1));
        geometry.addAttribute("position", new THREE.BufferAttribute(offsets, 2));

        geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), Infinity);
        geometry.boundingBox = new THREE.Box3(new THREE.Vector3(-0.5, -0.5, 0), new THREE.Vector3(0.5, 0.5, 0));

        this.mesh = new THREE.Points(geometry, this.material);
        this.mesh.frustumCulled = false;
        parent.add(this.mesh);
    }

    setAlpha(value) {
        this.material.uniforms.nodeAlpha.value = value;
    }

    setBackgroundColor(value) {
        this.material.uniforms.backgroundColor.value = value;
    }

    setOffsetBuffer(node) {
        let array = this.mesh.geometry.attributes.position.array;
        array[2 * node.id + 0] = node.getPositionX();
        array[2 * node.id + 1] = node.getPositionY();
    }

    setScaleBuffer(node) {
        let array = this.mesh.geometry.attributes.scale.array;
        array[node.id] = node.getRadius();
    }

    setColorBuffer(node) {
        let array = this.mesh.geometry.attributes.run0.array;
        array[2 * node.id + 0] = 1.0;
        array[2 * node.id + 1] = node.getColor();
    }

    setPieBuffer(node, percentages, colors) {
        if(percentages.length <= this.slices) {
            for(let i=0, totalPercent=0; i<percentages.length; i++) {
                var array = this.mesh.geometry.attributes["run" + i].array;
                totalPercent += percentages[i];
                array[2 * node.id + 0] = totalPercent;
                array[2 * node.id + 1] = colors[i];
            }
        }
    }

    updateColors() {
        for(let i=0; i<this.slices; i++) {
            this.mesh.geometry.attributes["run" + i].needsUpdate = true;
        }
    }

    updateScales() {
        this.mesh.geometry.attributes.scale.needsUpdate = true;
    }

    updateOffsets() {
        this.mesh.geometry.attributes.position.needsUpdate = true;
    }

    calculateScale(value, min=2, max=8) {
        return value * (max - min) + min;
    }

    setLODZoom(zoom) {
        return;
    }

    setPixelZoom(height) {
        this.material.uniforms.nodeZoom.value = height;
    }
}

class NodeInstance extends Draggable2D {
    constructor(id, data, parent) {
        super();
        this.id = id;
        this.userData = data;
        this.color = 0.0;
        this.r = 1.0;
        this.x = this.y = 0.0;
        this.fx = this.fy = null;

        if(data.name) {
            let div = document.createElement('div');
            div.className = "unselectable label";
            this.label = new THREE.CSS2DObject(div);
            parent.add(this.label);
            this.setLabelText(data.name);
        }
    }

    getPositionX() {
        return this.x;
    }

    getPositionY() {
        return this.y;
    }

    getPosition() {
        return new THREE.Vector3(this.x, this.y, 0);
    }

    setColor(value) {
        this.color = value;
    }

    getColor() {
        return this.color;
    }

    setRadius(value) {
        this.r = value;
    }

    getRadius() {
        return this.r;
    }

    boundsContains(vector) {
        let targ = this.getPosition();
        let r = this.r;

        //Check if inside bounding box;
        if(vector.x >= targ.x - r && 
            vector.x <= targ.x + r && 
            vector.y >= targ.y - r && 
            vector.y <= targ.y + r) {
            //Check if inside circle
            
            if(Math.pow(vector.x - targ.x, 2) + Math.pow(vector.y - targ.y, 2) <= r*r) {
                return true;
            }
        }
        return false;
    }

    boundsCenter() {
        return this.getPosition().clone();
    }

    setLabelText(text) {
        this.label.element.textContent = text;
    }

    removeLabelClassName(name) {
        this.label.element.classList.remove(name);
    }

    addLabelClassName(name) {
        this.label.element.classList.add(name);
    }

    updateLabelPosition() {
        if(this.label) {
            this.label.position.x = this.x;
            this.label.position.y = this.y + this.r * 2;
        }
    }
}