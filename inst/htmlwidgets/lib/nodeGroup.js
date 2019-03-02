const MAX_LOD_ZOOM = 40;
const MIN_LOD_ZOOM = 0.1;

class NodeGroup {
    constructor(colormap, nodes, parent, segments = 64, slices = 8) {
        this.segments = segments;
        this.slices = slices;

        var instance_count = 1;//nodes.length;
        var vertex_count = segments * 3;
        this.material = new THREE.RawShaderMaterial({
            uniforms: {
                nodetex: { type: "t", value: colormap.getTexture() },
            },
            vertexShader: /*glsl*/`
                precision highp float;

                uniform mat4 modelViewMatrix;
                uniform mat4 projectionMatrix;

                uniform sampler2D nodetex;

                attribute float face_id;

                attribute vec2 position;
                attribute float scale;

                ${Array.from({ length: slices }, (_, i) => "attribute vec2 run" + i + ";").join('')}

                varying vec4 vCol;

                void main() {
                    float u;

                    ${Array.from({ length: slices-1}, (_, i) => "if(run" + i + ".x>=(face_id)){u=run" + i + ".y;}else{").join('')}
                    ${"u=run" + (slices-1) + ".y;" + "}".repeat(slices-1)}
                    
                    vCol = texture2D( nodetex, vec2 ( u, 0.0 ) );
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

        let ids = new Float32Array(3 * segments);
        for(let i=0, j=0; i<segments; i++, j+=3) {
            ids[j] = ids[j+1] = ids[j+2] = i;
        }

        geometry.addAttribute("face_id", new THREE.BufferAttribute(ids, 1));
        geometry.addAttribute("position", new THREE.BufferAttribute(vertices, 2));
        
        var indices = new Array(3*segments).fill(0);
        geometry.setIndex(indices); //if this works, can't we use indexing to strip redundant positions?

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
        let runs = [new Run(20, 0.1), new Run(20, 0.7), new Run(24, 0.5)];
        this.setNodeRuns(0, runs);
        this.updateRuns();
    }

    //instead pass in two arrays, one for percentages and one for values
    setNodeRuns(id, runs) {
        if(runs.length <= this.slices) {
            for(let i=0, totalCount=0; i<runs.length; i++) {
                var array = this.mesh.geometry.attributes["run" + i].array;
                totalCount  += runs[i].count;
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
        /*
        for(let i=0; i<Math.sqrt(this.segments / 4); i++) {

        }*/

        var clamped = Math.min(Math.max(zoom, MIN_LOD_ZOOM), MAX_LOD_ZOOM);
        var t = 1.0 - (clamped - MIN_LOD_ZOOM)/(MAX_LOD_ZOOM - MIN_LOD_ZOOM);
        var lod = Math.round(THREE.Math.lerp(0, Math.sqrt(this.segments / 4), t)); //lod <= sqrt(segments / 4) i.e. a square, in this case 4
        lod = 3;
        var stride = 3 * Math.pow(2, lod) - 1;
        var indices = this.mesh.geometry.index.array;
        
        for(let i=0, j=0; j<3*segments; i+=3, j++) {
            indices[i] = j;
            indices[i+1] = j+1;
            j += stride;
            indices[i+2] = j;
        }
        console.log(this.mesh.geometry.index.array);
        this.mesh.geometry.index.needsUpdate = true;
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