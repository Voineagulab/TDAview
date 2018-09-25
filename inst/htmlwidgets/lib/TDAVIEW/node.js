let nodeMesh = undefined;

class node {
	constructor(index, label, radius, data) {
        this.index = index;
        this.label = label;
        this.setRadius(radius);
        Object.assign(this, data);
    }

    setRadius(value) {
        nodeMesh.geometry.attributes.scale.array[this.index] = value;
        this.r = value;
    }

    setColor(value) {
        nodeMesh.geometry.attributes.u.array[this.index] = value;
    }

    getColor() {
        return nodeMesh.geometry.attributes.u.array[this.index];
    }

    getPosition() {
        var tBuf =  nodeMesh.geometry.attributes.translation.array;
        return new THREE.Vector3(tBuf[this.index * 2], tBuf[this.index * 2 + 1], 0);
    }

    setPosition(x, y) {
        var tBuf = nodeMesh.geometry.attributes.translation.array;
        tBuf[this.index * 2] = x;
        tBuf[this.index * 2 + 1] = y;
        this.label.position.x = x;
        this.label.position.y = y + 2 * this.r;
    }

    setLabelText(text) {
        this.label.element.textContent = text;
    }

    //O(n) for number of nodes, not ideal to call every frame to position camera
    static computeBoundingBox() {
        let max = new THREE.Vector3(-Infinity, -Infinity, 0);
        let min = new THREE.Vector3(Infinity, Infinity, 0);
        let translations = nodeMesh.geometry.attributes.translation.array;
        let scales = nodeMesh.geometry.attributes.scale.array;

        for(let i=0, j=0; i<scales.length; i++, j+=2) {
            let x = translations[j];
            let y = translations[j+1];
            let s = scales[i];
            x += x > 0 ? s : -s;
            y += y > 0 ? s : -s;
            
            if(x > max.x) {
                max.x = x;
            } else if(x < min.x) {
                min.x = x;
            }

            if(y > max.y) {
                max.y = y;
            } else if(y < min.y) {
                min.y = y;
            }
        }
        if(nodeMesh.geometry.boundingBox) {
            nodeMesh.geometry.boundingBox.min = min;
            nodeMesh.geometry.boundingBox.max = max;
        } else {
            nodeMesh.geometry.boundingBox = new THREE.Box3(min, max);
        }
    }

    static getBoundingBox() {
        return nodeMesh.geometry.boundingBox;
    }

    static updatePositions() {
        nodeMesh.geometry.attributes.translation.needsUpdate = true;
    }

    static updateScales() {
        nodeMesh.geometry.attributes.scale.needsUpdate = true;
    }

    static updateColors() {
        nodeMesh.geometry.attributes.u.needsUpdate = true;
    }

    static generateInstances(data, texture, parent, segments=32) {
        var geometry = new THREE.InstancedBufferGeometry();
        var vertices = new Float32Array(2*(segments+1));
        vertices[0] = vertices[1] = 0.0;
        for(let i=2; i<vertices.length; i+=2) {
            var theta = i/segments * Math.PI * 2;
            vertices[i] = Math.sin(theta);
            vertices[i+1] = Math.cos(theta);
        }
        var indices = new Uint8Array(3*(segments-1));
        for(let i=0, j=0; i<indices.length; i+=3, j++) {
            indices[i] = 0;
            indices[i+1] = j+2;
            indices[i+2] = j+1;
        }

        geometry.addAttribute('position', new THREE.BufferAttribute(vertices, 2)); //xy
        geometry.setIndex(new THREE.BufferAttribute(indices, 1));

        var translation = new Float32Array(data.length * 2).fill(0.0); //xy
        var scale = new Float32Array(data.length).fill(1.0); //r
        var uv = new Float32Array(data.length).fill(0.0); //u
        
        geometry.addAttribute('translation', new THREE.InstancedBufferAttribute(translation, 2, 1).setDynamic(true));
        geometry.addAttribute('scale', new THREE.InstancedBufferAttribute(scale, 1, 1));
        geometry.addAttribute('u', new THREE.InstancedBufferAttribute(uv, 1, 1));

        geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 1);
        geometry.computeBoundingBox();

        var material = new THREE.RawShaderMaterial({
            uniforms: {
                image: {
                    type: 't',
                    value: texture
                }
            },
            vertexShader: [
                "precision highp float;",
                "",
                "uniform mat4 modelViewMatrix;",
                "uniform mat4 projectionMatrix;",
                "",
                "attribute vec2 translation;",
                "attribute float scale;",
                "attribute float u;",
                "attribute vec2 position;",
                "varying float vU;",
                "",
                "void main() {",
                "",
                "   vU = u;",
                "	gl_Position = projectionMatrix * modelViewMatrix * vec4 ( position * scale + translation, 0.0, 1.0 );",
                "",
                "}"
                ].join("\n"),
            fragmentShader: [
                "precision highp float;",
                "",
                "uniform sampler2D texture;",
                "varying float vU;",
                "",
                "void main() {",
                "",
                "   gl_FragColor = texture2D( texture, vec2 ( vU, 0.0 ) );",
                "",
                "}"
                ].join("\n"),
          side: THREE.FrontSide,
          transparent: false
        });
        
        nodeMesh = new THREE.Mesh(geometry, material);
        parent.add(nodeMesh);
        
        var nodes = new Array(data.length);
        for(let i=0; i<nodes.length; i++) {
            var nodeDiv = document.createElement('div');
            nodeDiv.className = 'unselectable label nlabel';
            nodeDiv.textContent = 'Node ' + i;

            var nodeLabel = new THREE.CSS2DObject(nodeDiv);
            nodeLabel.position.set(0, 0, 0);

            nodes[i] = new node(i, nodeLabel, 1, data[i]);
            parent.add(nodeLabel);
        }
        return nodes;
    }
}