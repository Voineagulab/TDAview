const MAX_LOD_ZOOM = 65;
const MIN_LOD_ZOOM = 0.1;

class NodeGroup {
    constructor(colormap, nodes, parent, segments = 64, slices = 8) {
        this.segments = segments;
        this.slices = slices;

        var instance_count = 1;//nodes.length;
        var vertex_count = segments * 3;
        this.material = new THREE.RawShaderMaterial({
            uniforms: {
                stride: { type: "f", value: 1.0},
                face_max: { type: "f", value: segments},
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
                attribute float scale;

                ${Array.from({ length: slices }, (_, i) => "attribute vec2 run" + i + ";").join('')}

                varying vec4 vCol;

                void main() {
                    float u;
                    float face_percent = floor(vertex_id/stride)/face_max;

                    ${Array.from({ length: slices-1}, (_, i) => "if(run" + i + ".x>=face_percent){u=run" + i + ".y;}else{").join('')}
                    ${"u=run" + (slices-1) + ".y;" + "}".repeat(slices-1)}
                    
                    vCol = texture2D( nodetex, vec2 ( u , 0.0 ) );
                    gl_Position = projectionMatrix * modelViewMatrix * vec4 ( position * scale, 0.0, 1.0 );
                }`,
            fragmentShader: /*glsl*/`
                precision highp float;

                varying vec4 vCol;

                void main() {
                    gl_FragColor = vCol;
                }`,
            side: THREE.DoubleSide,
            transparent: false,
            vertexColors: THREE.VertexColors,
        });

        let geometry = new THREE.InstancedBufferGeometry();
        let vertices = new Float32Array(6 * segments);
        for(let i=0, j=0, k=0; i<segments; i++, j+=6, k+=3) {
            vertices[j] = vertices[j+1] = 0.0;
            var theta = i/segments * Math.PI * 2;
            vertices[j+2] = Math.sin(theta);
            vertices[j+3] = Math.cos(theta);
            theta = (i+1)/segments * Math.PI * 2;
            vertices[j+4] = Math.sin(theta);
            vertices[j+5] = Math.cos(theta);
        }

        //TODO: Create all LOD possibilities and update buffer range - or use stride?
        let ids = new Float32Array(3*segments);
        for(let i=0; i<3*segments; i++) {
            ids[i] = i;
        }

        geometry.addAttribute("vertex_id", new THREE.BufferAttribute(ids, 1));
        geometry.addAttribute("position", new THREE.BufferAttribute(vertices, 2));

        //Create all LOD possible indices and set levels array
        let levelCount = Math.log2(this.segments);
        this.levels = new Array(levelCount-2);
        let indexCount = 2 * this.segments - 1;
        let indices = new Array(3 * indexCount);
        for(let i=1, stride=2, curr=0; i<levelCount-1; stride=3*Math.pow(2, ++i)-1) {
            for(let j=0; j<3*this.segments; j++, curr+=3) {
                indices[curr+0] = j;
                indices[curr+1] = j+1;
                j += stride;
                indices[curr+2] = j;
            }
            this.levels[i-1] = 9*this.segments/(stride+1);
        }
        geometry.setIndex(indices);

        for(let i=0; i<slices; i++) {
            let runVectors = new Float32Array(2 * instance_count).fill(Infinity);
            geometry.addAttribute("run" + i, new THREE.InstancedBufferAttribute(runVectors, 2, 1));
        }

        let scales = new Float32Array(instance_count).fill(1.0);
        geometry.addAttribute("scale", new THREE.InstancedBufferAttribute(scales, 1, 1));

        geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 1);
        geometry.boundingBox = new THREE.Box3(new THREE.Vector3(-0.5, -0.5, 0), new THREE.Vector3(0.5, 0.5, 0));

        this.mesh = new THREE.Mesh(geometry, this.material);
        parent.add(this.mesh);

        //Set run values of first node
        let runs = [new Run(0.1, 0.1), new Run(0.5, 0.3), new Run(0.15, 0.6), new Run(0.25, 0.9)];
        this.setNodeRuns(0, runs);
        this.updateRuns();
    }

    //instead pass in two arrays, one for percentages and one for values
    setNodeRuns(id, runs) {
        if(runs.length <= this.slices) {
            for(let i=0, totalCount=0; i<runs.length; i++) {
                var array = this.mesh.geometry.attributes["run" + i].array;
                totalCount += runs[i].count;
                array[2 * id + 0] = totalCount;
                array[2 * id + 1] = runs[i].value;
            }
        }
    }

    updateRuns() {
        for(let i=0; i<this.slices; i++) {
            this.mesh.geometry.attributes["run" + i].needsUpdate = true;
        }
    }

    setLODZoom(zoom) {
        //Update indices to skip vertices in fan
        var clamped = Math.min(Math.max(zoom, MIN_LOD_ZOOM), MAX_LOD_ZOOM);
        var t = 1.0 - (clamped - MIN_LOD_ZOOM)/(MAX_LOD_ZOOM - MIN_LOD_ZOOM);
        var lod = Math.floor(THREE.Math.lerp(0, Math.log2(this.segments/4), t));
        var stride = 3 * Math.pow(2, lod);
        var index = this.mesh.geometry.index.array;
        let i=0;
        for(let j=0; j<3*this.segments; i+=3) {
            index[i] = j;
            index[i+1] = j+1;
            j += stride;
            index[i+2] = j-1;
        }

        //Zero remainder of buffer
        for(; i<index.length; i++) {
            index[i] = 0;
        }
        
        //Push buffer
        this.mesh.geometry.index.needsUpdate = true;

        //Update uniforms
        this.material.uniforms.stride.value = stride;
        this.material.uniforms.face_max.value = (3*this.segments)/stride - 1;
        

        //vertex_ids = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]
        //stride = 5 //NO, 6
        //face_ids = [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3];
        //face_max = 3
        //percentages = [0, 0, 0, 0, 0, 0.33, 0.33...];

        //Does this separate individual triangles? Only if we use stride+1
    }
}

class NodeInstance {
    constructor() {

    }
}

class Run {
    constructor(count, value) {
        this.count = count;
        this.value = value;
    }
}