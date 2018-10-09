var nodeMaterial = null;

const segments = 64;
class node {
    static intMaterial(colormap) {
        nodeMaterial = new THREE.RawShaderMaterial({
            uniforms: {
                texture: { type: "t", value: colormap.getTexture() },
            },
            vertexShader: [
                "precision highp float;",
                "",
                "uniform mat4 modelViewMatrix;",
                "uniform mat4 projectionMatrix;",
                "",
                "attribute vec2 position;",
                "attribute float u;",
                "varying float vU;",
                "",
                "void main() {",
                "",
                "   vU = u;",
                "   gl_Position = projectionMatrix * modelViewMatrix * vec4 ( position , 0.0, 1.0 );",
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
                "    gl_FragColor = texture2D( texture, vec2 ( vU, 0.0 ) );",
                "",
                "}"
                ].join("\n"),
            side: THREE.DoubleSide,
            transparent: false
        });
    }

	constructor(index, labelText, data, color, parent) {
        this.index = index;
        Object.assign(this, data);

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

        //Generate random pie chart
        var uvs = new Float32Array(3 * segments);
        let curr = 0;
        for(let j=0; j<3 * segments; j++) {
            if(Math.random() < 0.02) {
                curr = Math.min(curr + Math.random()/2, 1.0);
            }
            uvs[j] = curr;
        }

        geometry.addAttribute("position", new THREE.BufferAttribute(vertices, 2).setDynamic(true));
        geometry.addAttribute("u", new THREE.BufferAttribute(uvs, 1));

        geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 1);
        geometry.boundingBox = new THREE.Box3(new THREE.Vector3(-0.5, -0.5, 0), new THREE.Vector3(0.5, 0.5, 0));

        this.mesh = new THREE.Mesh(geometry, nodeMaterial);

        //Create label
        var nodeDiv = document.createElement('div');
        nodeDiv.className = 'unselectable label nlabel';
        nodeDiv.textContent = labelText;
        
        this.label = new THREE.CSS2DObject(nodeDiv);
        
        this.mesh.add(this.label);
        
        this.label.position.setY(1);
        this.setRadius(1);
        this.setColor(color);

        parent.add(this.mesh);
    }

    setRadius(value) {
        this.mesh.scale.set(value, value, 1);
        this.r = value;
    }

    setColor(value) {
        this.color = value;
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
}