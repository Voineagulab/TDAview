const MAX_NODE_SIZE = 8;
const MIN_NODE_SIZE = 2;

class NodeRenderer extends THREE.Group {
    constructor(colormap, count, maxAttributes = 16, maxVaryings = 8) {
        super();
        this.slices = Math.min(maxAttributes-4, 2*maxVaryings-1);
        this.instance_count = count;

        this.material = new THREE.RawShaderMaterial({
            uniforms: {
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
            #ifdef GL_OES_standard_derivatives
                #extension GL_OES_standard_derivatives : enable
            #endif
                precision highp float;

                #define M_PI 3.14159265358979

                uniform sampler2D nodeTex;
            
                varying vec2 vPosition;
                ${Array.from({ length: this.slices }, (_, i) => "varying vec2 vRun" + i + ";").join('')}

                void main() {
                    vec2 cxy = 2.0 * gl_PointCoord - 1.0;
                    float r = dot(cxy, cxy);
                    float a;

                #ifdef GL_OES_standard_derivatives
                    float d = fwidth(r);
                    a = 1.0 - smoothstep(1.0 - d, 1.0 + d, r);
                #else
                    if (r > 1.0) discard;
                    a = 1.0;
                #endif

                    float pixelPercent = 1.0 - (1.0 + atan(cxy.x, cxy.y) / M_PI) / 2.0;
                    vec2 curr;

                #ifdef GL_OES_standard_derivatives
                    vec2 prev;
                    if(pixelPercent<=vRun0.x){curr=vRun0;prev=vRun0;}else{
                    ${Array.from({ length: this.slices-2}, (_, i) => "if(pixelPercent<=vRun" + (i+1) + ".x){curr=vRun" + (i+1) + ";prev=vRun" + (i) + ";}else{").join('')}
                    ${"curr=vRun" + (this.slices-1) + ";prev=vRun" + (this.slices-1) + ";" + "}".repeat(this.slices-1)}
                    d = mod(fwidth(pixelPercent), 1.0);
                    vec3 c = mix(texture2D( nodeTex, vec2 ( prev.y , 1.0) ).xyz, texture2D( nodeTex, vec2 ( curr.y , 1.0) ).xyz, clamp((pixelPercent - prev.x) / d, 0.0, 1.0));
                    gl_FragColor = vec4( c, a);
                #else
                    ${Array.from({ length: this.slices-1}, (_, i) => "if(pixelPercent<=vRun" + i + ".x){curr=vRun" + i + ";}else{").join('')}
                    ${"curr=vRun" + (this.slices-1) + ";" + "}".repeat(this.slices-1)}
                    gl_FragColor = vec4( texture2D( nodeTex, vec2 ( curr.y , 1.0) ).xyz, a);
                #endif
                }`,
            side: THREE.FrontSide,
            transparent: true,
        });

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
        this.add(this.mesh);

        
    }

    setAlpha(value) {
        this.material.uniforms.nodeAlpha.value = value;
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

class NodeNeighbor {
    constructor(node, angle) {
        this.node = node;
        this.angle = angle;
    }
}

class NodeInstance extends Draggable2D {
    constructor(id, data, parent) {
        super();
        this.id = id;
        this.userData = data;
        this.color = 0.0;
        this.r = 1.0;
        this.x = this.y = 0;
        this.fx = this.fy = null;
        let div = document.createElement('div');
        div.className = "unselectable label";
        this.label = new THREE.CSS2DObject(div);
        parent.add(this.label);
        this.neighbors = [];
    }

    addNeighbor(node) {
        this.neighbors.push(node);
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

    boundsWidth() {
        return this.r*2;
    }

    boundsHeight() {
        return this.r*2;
    }

    setLabelText(text) {
        this.label.element.textContent = text;
    }

    setLabelSize(value) {
        this.label.element.style.fontSize = value;
    }

    removeLabelClassName(name) {
        if(this.label) {
            this.label.element.classList.remove(name);
        }
    }

    addLabelClassName(name) {
        if(this.label) {
            this.label.element.classList.add(name);
        }
    }

    updateLabelPosition(simpleLayout = false) {
        if(this.label) {
            if(!this.neighbors.length || simpleLayout) {
                this.label.position.x = this.x;
                this.label.position.y = this.y + this.r * 2;
            } else {
                let n = new Array(this.neighbors.length);
                for(let i=0; i<n.length; i++) {
                    n[i] = new NodeNeighbor(this.neighbors[i], Math.PI + Math.atan2(this.neighbors[i].x - this.x, this.neighbors[i].y - this.y));
                }
                n.sort((a, b) => a.angle - b.angle);


                let difference = 2 * Math.PI - n[n.length-1].angle + n[0].angle;
                let midAngle = n[n.length-1].angle + difference/2 - 2 * Math.PI;
                
                
                for(let i=0, d=0; i<(n.length-1); i++) {
                    d = n[i+1].angle - n[i].angle;
                    if(d > difference) {
                        midAngle = n[i].angle + d/2;
                        difference = d;
                    }
                }
                midAngle -= Math.PI
                this.label.position.x = this.x + Math.sin(midAngle) * 2 * this.r;
                this.label.position.y = this.y + Math.cos(midAngle) * 2 * this.r;
            }
        }
    }
}