var nodeMaterial = null;

const segments = 64;
class node extends Draggable2D {
    static intMaterial(colormap) {
        nodeMaterial = new THREE.RawShaderMaterial({
            uniforms: {
                nodetex: { type: "t", value: colormap.getTexture() },
            },
            vertexShader: [
                "precision highp float;",
                "",
                "uniform mat4 modelViewMatrix;",
                "uniform mat4 projectionMatrix;",
                "uniform sampler2D nodetex;",
                "",
                "attribute vec2 position;",
                "attribute float u;",
                "varying vec4 vCol;",
                "",
                "void main() {",
                "",
                "   vCol = texture2D( nodetex, vec2 ( u, 0.0 ) );",
                "   gl_Position = projectionMatrix * modelViewMatrix * vec4 ( position , 0.0, 1.0 );",
                "",
                "}"
                ].join("\n"),
            fragmentShader: [
                "precision highp float;",
                "",
                "varying vec4 vCol;",
                "",
                "void main() {",
                "",
                "    gl_FragColor = vCol;",
                "",
                "}"
                ].join("\n"),
            side: THREE.DoubleSide,
            transparent: false,
            vertexColors: THREE.VertexColors
        });
    }

    static updateColorMap(colormap) {
        nodeMaterial.uniforms.nodetex.value = colormap.getTexture();
    }

	constructor(index, labelText, data, color, parent) {
        super();
        this.index = index;
        this.userData = data;

        //Create mesh
        var geometry = new THREE.BufferGeometry();
        var vertices = new Float32Array(6*segments);
        for(let i=0, j=0, k=0; i<segments; i++, j+=6, k+=3) {
            vertices[j] = vertices[j+1] = 0.0;
            var theta = i/segments * Math.PI * 2;
            vertices[j+2] = Math.sin(theta);
            vertices[j+3] = Math.cos(theta);
            theta = (i+1)/segments * Math.PI * 2;
            vertices[j+4] = Math.sin(theta);
            vertices[j+5] = Math.cos(theta);
        }

        //Calculate indices to skip triangles for a given level of detal from 0 to sqrt(segments)
        var lod = 0; //lod <= sqrt(segments / 4) i.e. a square
        var stride = 3 * Math.pow(2, lod) - 1;
        var indices = new Array(3*segments).fill(0);
        for(let i=0, j=0; j<3*segments; i+=3, j++) {
            indices[i] = j;
            indices[i+1] = j+1;
            j += stride;
            indices[i+2] = j;
        }
        
        geometry.setIndex(indices);

        var uvs = new Float32Array(3 * segments).fill(color);

        geometry.addAttribute("position", new THREE.BufferAttribute(vertices, 2).setDynamic(true));
        geometry.addAttribute("u", new THREE.BufferAttribute(uvs, 1));

        geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 1);
        geometry.boundingBox = new THREE.Box3(new THREE.Vector3(-0.5, -0.5, 0), new THREE.Vector3(0.5, 0.5, 0));

        this.mesh = new THREE.Mesh(geometry, nodeMaterial);

        //Create label
        var nodeDiv = document.createElement('div');
        nodeDiv.className = 'unselectable label nlabel';
        nodeDiv.textContent = labelText;
        //this.label = new THREE.CSS2DObject(nodeDiv);
        //this.mesh.add(this.label);
        //this.label.position.setY(1);

        this.setRadius(1, 0, 1);
        this.setColor(color);

        parent.add(this.mesh);
    }

    setRadius(value, min=2, max=8)  {
        this.r = value * (max - min) + min;
        this.mesh.scale.set(this.r, this.r, 1);
    }

    setColor(value) {
        this.color = value;
        this.mesh.geometry.attributes.u.array.fill(value);
        this.mesh.geometry.attributes.u.needsUpdate = true;
    }

    setColorPie(values) { //e.g. [0.1, 0, 0.7, 0.2]
        let uvs = this.mesh.geometry.attributes.u.array;
        let maxVal = -Infinity;
        let maxCol = 0.0;
        for(let i=0, index=0, color=0; i<values.length; i++, color+=1/(values.length - 1)) { //-1 due to weird step spacing
            for(let j=0; j<values[i] * segments * 3; j++, index++) {
                uvs[index] = color;
            }

            if(values[i] > maxVal) {
                maxCol = color;
                maxVal = values[i];
            }
        }
        this.color = maxCol;
        this.mesh.geometry.attributes.u.needsUpdate = true;
    }

    getColor() {
        return this.color;
    }

    getPosition() {
        return this.mesh.position;
    }

    setPosition(x, y) {
        this.mesh.position.x = x;
        this.mesh.position.y = y;
    }

    setLabelText(text) {
        this.label.element.textContent = text;
    }

    addLabelClassName(className) {
        this.label.element.classList.add(className);
    }

    removeLabelClassName(className) {
        this.label.element.classList.remove(className);
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