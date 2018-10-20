var linkMaterial = null;

const LINE_WIDTH = 0.4;
class link {
    static initMaterial(colormap) {
        linkMaterial = new THREE.RawShaderMaterial({
            uniforms: {
                linktex: { type: 't', value: colormap.getTexture() }
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
                "	gl_Position = projectionMatrix * modelViewMatrix * vec4 ( position, -2.0, 1.0 );",
                "",
                "}"
                ].join("\n"),
            fragmentShader: [
                "precision highp float;",
                "",
                "uniform sampler2D linktex;",
                "varying float vU;",
                "",
                "void main() {",
                "",
                "   gl_FragColor = texture2D( linktex, vec2 ( vU, 0.0 ) );",
                "",
                "}"
                ].join("\n"),
            side: THREE.DoubleSide,
            transparent: false
        });
    }

    static updateColorMap(colormap) {
        linkMaterial.uniforms.linktex.value = colormap.getTexture();
    }

	constructor(source, target, parent) {
		this.source = source;
        this.target = target;
        
        var geometry = new THREE.BufferGeometry();
        var indices = new Uint8Array([0, 1, 2, 0, 2, 3]);
        var vertices = new Float32Array([
            0.0, 0.0,
            0.0, 0.0,
            0.0, 0.0,
            0.0, 0.0,
        ]);

        var uv = new Float32Array(4).fill(0.0);

        geometry.setIndex(new THREE.BufferAttribute(indices, 1));
        geometry.addAttribute('position', new THREE.BufferAttribute(vertices, 2).setDynamic(true)); //xy
        geometry.addAttribute('u', new THREE.BufferAttribute(uv, 1)); //u

        geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 0);
        geometry.computeBoundingBox();

        this.mesh = new THREE.Mesh(geometry, linkMaterial);
        this.mesh.frustumCulled = false;
        parent.add(this.mesh);
    }

    setColor(value) {
        this.mesh.geometry.attributes.u.array.fill(value);
    }

    setGradient(from, to) {
        var uBuf = this.mesh.geometry.attributes.u.array;
        uBuf[0] = uBuf[1] = from;
        uBuf[2] = uBuf[3] = to;
    }

    setColorFromNodes() {
        this.setColor((this.source.getColor() + this.target.getColor())/2.0);
    }

    setGradientFromNodes() {
        this.setGradient(this.source.getColor(), this.target.getColor());
    }

    setPositionFromNodes() { //[0, 1, 2, 0, 2, 3]);
        var sourcePos = new THREE.Vector3(this.source.x, this.source.y, 0);
        var targetPos = new THREE.Vector3(this.target.x, this.target.y, 0);
        var cross = new THREE.Vector2(-(targetPos.y - sourcePos.y), targetPos.x - sourcePos.x).normalize();
        var p0 = cross.clone().multiplyScalar(this.source.r * LINE_WIDTH).add(sourcePos);
        var p1 = cross.clone().multiplyScalar(this.source.r * -LINE_WIDTH).add(sourcePos);
        var p2 = cross.clone().multiplyScalar(this.target.r * -LINE_WIDTH).add(targetPos);
        var p3 = cross.clone().multiplyScalar(this.target.r * LINE_WIDTH).add(targetPos);
        var p = this.mesh.geometry.attributes.position.array;
        p[0] = p0.x; p[1] = p0.y;
        p[2] = p1.x; p[3] = p1.y;
        p[4] = p2.x; p[5] = p2.y;
        p[6] = p3.x; p[7] = p3.y;
    }

    updatePosition() {
        this.mesh.geometry.attributes.position.needsUpdate = true;
    }

    updateColor() {
        this.mesh.geometry.attributes.u.needsUpdate = true;
    }
}