const MAX_NODE_SIZE = 8;
const MIN_NODE_SIZE = 2;
const LOD_ZOOMS = [1, 4, 20, 65];
const LOD_VALUES = [4, 3, 2, 1];

class NodeRenderer {
    constructor(colormap, nodes, parent, maxAttributes = 16, maxSegments = 128) {
        this.segments = maxSegments;
        this.slices = maxAttributes - 4;
        this.instance_count = nodes.length;
        this.vertex_count = this.segments * 3;
        this.current_lod = 0;

        this.material = new THREE.RawShaderMaterial({
            uniforms: {
                stride: { type: "f", value: 1.0},
                face_max: { type: "f", value: this.segments},
                nodetex: { type: "t", value: colormap.getTexture() },
            },
            vertexShader: /*glsl*/`
                precision highp float;

                uniform mat4 modelViewMatrix;
                uniform mat4 projectionMatrix;

                uniform float stride;
                uniform float face_max;
                
                uniform sampler2D nodetex;

                attribute float vertex_id;

                attribute vec2 position;
                attribute vec2 offset;
                attribute float scale;

                ${Array.from({ length: this.slices }, (_, i) => "attribute vec2 run" + i + ";").join('')}

                varying vec4 vCol;

                void main() {
                    float u;
                    float face_percent = floor(vertex_id/stride)/face_max;

                    ${Array.from({ length: this.slices-1}, (_, i) => "if(run" + i + ".x>=face_percent){u=run" + i + ".y;}else{").join('')}
                    ${"u=run" + (this.slices-1) + ".y;" + "}".repeat(this.slices-1)}
                    
                    vCol = texture2D( nodetex, vec2 ( u , 0.0 ) );
                    gl_Position = projectionMatrix * modelViewMatrix * vec4 ( offset + position * scale, 0.0, 1.0 );
                }`,
            fragmentShader: /*glsl*/`
                precision highp float;

                varying vec4 vCol;

                void main() {
                    gl_FragColor = vCol;
                }`,
            side: THREE.BackSide,
            transparent: false,
            vertexColors: THREE.VertexColors,
        });
        let geometry = new THREE.InstancedBufferGeometry();

        //Create vertices and associated ids
        let vertexIds = Float32Array.from({length: this.vertex_count}, (_, i) => i);
        let vertices = new Float32Array(2 * this.vertex_count);
        for(let i=0, j=0, k=0; i<this.segments; i++, j+=6, k+=3) {
            vertices[j] = vertices[j+1] = 0.0;
            var theta = i/this.segments * Math.PI * 2;
            vertices[j+2] = Math.sin(theta);
            vertices[j+3] = Math.cos(theta);
            theta = (i+1)/this.segments * Math.PI * 2;
            vertices[j+4] = Math.sin(theta);
            vertices[j+5] = Math.cos(theta);
        }
        
        geometry.addAttribute("vertex_id", new THREE.BufferAttribute(vertexIds, 1));
        geometry.addAttribute("position", new THREE.BufferAttribute(vertices, 2));
        
        //Initiallise index buffer
        let indices = new Array(this.vertex_count).fill(0.0);
        geometry.setIndex(indices);

        //Create paired attributes for pie slice run-length encoding
        for(let i=0; i<this.slices; i++) {
            let runVectors = new Float32Array(2 * this.instance_count).fill(Infinity);
            geometry.addAttribute("run" + i, new THREE.InstancedBufferAttribute(runVectors, 2, 1));
        }

        //Initiallise node scales
        let offsets = new Float32Array(2 * this.instance_count);
        for(let i=0; i<offsets.length; i++) {
            offsets[i] = 0.0;
        }
        let scales = new Float32Array(this.instance_count).fill(-1);
        geometry.addAttribute("scale", new THREE.InstancedBufferAttribute(scales, 1, 1));
        geometry.addAttribute("offset", new THREE.InstancedBufferAttribute(offsets, 2, 1));

        geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), Infinity);
        geometry.boundingBox = new THREE.Box3(new THREE.Vector3(-0.5, -0.5, 0), new THREE.Vector3(0.5, 0.5, 0));

        this.mesh = new THREE.Mesh(geometry, this.material);
        parent.add(this.mesh);
    }

    setOffsetBuffer(node) {
        let array = this.mesh.geometry.attributes.offset.array;
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
        this.mesh.geometry.attributes.offset.needsUpdate = true;

    }

    calculateScale(value, min=2, max=8) {
        return value * (max - min) + min;
    }

    setLODZoom(zoom) {
        //Update indices to skip vertices in fan
        let lod = 0;
        for(let i=0; i<LOD_ZOOMS.length; i++) {
            if(zoom <= LOD_ZOOMS[i]) {
                lod = LOD_VALUES[i];
                break;
            }
        }

        if(lod != this.current_lod) {
            this.current_lod = lod;

            var stride = 3 * Math.pow(2, lod);
            var indices = this.mesh.geometry.index.array;

            let i=0;
            for(let j=0; j<this.vertex_count; i+=3) {
                indices[i] = j;
                indices[i+1] = j+1;
                j += stride;
                indices[i+2] = j-1;
            }
    
            //Zero remainder of buffer
            for(; i<indices.length; i++) {
                indices[i] = 0;
            }
            
            //Push buffer
            this.mesh.geometry.index.needsUpdate = true;
    
            //Update uniforms
            this.material.uniforms.stride.value = stride;
            this.material.uniforms.face_max.value = (this.vertex_count)/stride - 1;
        }
    }
}

class NodeInstance extends Draggable2D {
    constructor(id, data) {
        super();
        this.id = id;
        this.userData = data;
        this.color = 0.0;
        this.r = 1.0;
        this.x = this.y = 0.0;
        this.fx = this.fy = null;
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
}