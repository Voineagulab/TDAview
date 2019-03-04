class LinkRenderer {
    constructor(linkmap, nodes, adjacency, parent, width = 0.4) {
        this.width = width;

        this.material = new THREE.RawShaderMaterial({
            uniforms: {
                linktex: { type: 't', value: linkmap.getTexture() }
            },
            vertexShader: /*glsl*/`
                precision highp float;
                
                uniform mat4 modelViewMatrix;
                uniform mat4 projectionMatrix;
                uniform sampler2D linktex;
                
                attribute vec2 position;
                attribute float u;

                varying vec4 vColor;
                
                void main() {
                    vColor = texture2D( linktex, vec2 ( u, 0.0 ) );
                    gl_Position = projectionMatrix * modelViewMatrix * vec4 ( position, -2.0, 1.0 );
                }`,
            fragmentShader: /*glsl*/`
                precision highp float;
                
                varying vec4 vColor;
                
                void main() {
                   gl_FragColor = vColor;
                }`,
            side: THREE.DoubleSide,
            transparent: false,
            vertexColors: THREE.VertexColors
        });

        this.links = [];
        for(let i=0, curr=0; i<adjacency[0].length; i++) {
            let row = adjacency[i];
            for(let j=0; j<row.length; j++) {
                if(row[j]) {
                    this.links.push(new LinkInstance(curr++, nodes[i], nodes[j]));
                }
            }
        }

        let geometry = new THREE.BufferGeometry();

        let vertices = new Float32Array(8 * this.links.length);
        geometry.addAttribute("position", new THREE.BufferAttribute(vertices, 2));

        let indices = new Array(6 * this.links.length);
        for(let i=0, j=0; i<indices.length; i+=6, j+=4) {
            indices[i+0] = j+0;
            indices[i+1] = indices[i+3] = j+1;
            indices[i+2] = indices[i+4] = j+2;
            indices[i+5] = j+3;
        }

        geometry.setIndex(indices);

        let uv = new Float32Array(4 * this.links.length);
        geometry.addAttribute("u", new THREE.BufferAttribute(uv, 1));

        geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), Infinity);
        geometry.boundingBox = new THREE.Box3(new THREE.Vector3(-0.5, -0.5, 0), new THREE.Vector3(0.5, 0.5, 0));
        
        this.mesh = new THREE.Mesh(geometry, this.material);
        parent.add(this.mesh);
    }

    setColorMap(map) {
        this.material.uniforms.linktex.value = map.getTexture();
    }

    setWidth(value) {
        this.width = value;
    }

    setColor(link, value) {
        var array = this.mesh.geometry.attributes.u.array;
        var index = 4 * link.id;
        array[index + 0] = array[index + 1] = array[index + 2] = array[index + 3] = value;
    }

    setGradient(link, from, to) {
        var array = this.mesh.geometry.attributes.u.array;
        var index = 4 * link.id;
        array[index + 0] = array[index + 1] = from;
        array[index + 2] = array[index + 3] = to;
    }

    setGradientFromNodes(link) {
        this.setGradient(link, link.source.getColor(), link.target.getColor());
    }

    updateColors() {
        this.mesh.geometry.attributes.u.needsUpdate = true;
    }

    setPositionFromNodes(link) {
        //Calculate four positions on circumferences perpendicular to link direction 
        var sourcePos = new THREE.Vector3(link.source.x, link.source.y, 0);
        var targetPos = new THREE.Vector3(link.target.x, link.target.y, 0);
        var cross = new THREE.Vector2(-(targetPos.y - sourcePos.y), targetPos.x - sourcePos.x).normalize();
        var p0 = cross.clone().multiplyScalar(link.source.r * this.width).add(sourcePos);
        var p1 = cross.clone().multiplyScalar(link.source.r * -this.width).add(sourcePos);
        var p2 = cross.clone().multiplyScalar(link.target.r * -this.width).add(targetPos);
        var p3 = cross.clone().multiplyScalar(link.target.r * this.width).add(targetPos);
        
        //Assign all vector components to buffer
        var p = this.mesh.geometry.attributes.position.array;
        var index = 8 * link.id;
        p[index + 0] = p0.x; p[index + 1] = p0.y;
        p[index + 2] = p1.x; p[index + 3] = p1.y;
        p[index + 4] = p2.x; p[index + 5] = p2.y;
        p[index + 6] = p3.x; p[index + 7] = p3.y;
    }

    updatePositions() {
        this.mesh.geometry.attributes.position.needsUpdate = true;
    }
}

class LinkInstance {
    constructor(id, source, target) {
        this.id = id;
        this.source = source;
        this.target = target;
    }
}