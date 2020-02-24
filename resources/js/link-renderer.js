class LinkRenderer extends THREE.Group {
    constructor(linkmap, count, width = 0.1) {
        super();
        this.width = width;

        this.material = new THREE.RawShaderMaterial({
            uniforms: {
                backgroundColor: {value: new THREE.Color() },
                linkAlpha: {value: 1.0},
                linkTex: {value: linkmap.getTexture() }
            },
            vertexShader: /*glsl*/`
                precision highp float;

                uniform mat4 modelViewMatrix;
                uniform mat4 projectionMatrix;
                uniform sampler2D linkTex;
                uniform float linkAlpha;
                uniform vec3 backgroundColor;

                attribute vec2 position;
                attribute float u;

                varying vec4 vColor;

                void main() {
                    vColor = vec4( mix( backgroundColor, texture2D( linkTex, vec2 ( u , 1.0) ).xyz, linkAlpha), 1.0);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4 ( position, -2.0, 1.0 );
                }`,
            fragmentShader: /*glsl*/`
                precision highp float;

                varying vec4 vColor;

                void main() {
                   gl_FragColor = vColor;
                }`,
            side: THREE.FrontSide,
            transparent: false,
        });

        let geometry = new THREE.BufferGeometry();

        let vertices = new Float32Array(8 * count);
        geometry.addAttribute("position", new THREE.BufferAttribute(vertices, 2));

        let indices = new Array(6 * count);
        for(let i=0, j=0; i<indices.length; i+=6, j+=4) {
            indices[i+0] = indices[i+3] = j+0;
            indices[i+1] = j+1;
            indices[i+2] = indices[i+4] = j+2;
            indices[i+5] = j+3;
        }

        geometry.setIndex(indices);

        let uv = new Float32Array(4 * count);
        geometry.addAttribute("u", new THREE.BufferAttribute(uv, 1));

        geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), Infinity);
        geometry.boundingBox = new THREE.Box3(new THREE.Vector3(-0.5, -0.5, 0), new THREE.Vector3(0.5, 0.5, 0));

        this.mesh = new THREE.Mesh(geometry, this.material);
        this.add(this.mesh);
    }

    setAlpha(value) {
        this.material.uniforms.linkAlpha.value = value;
    }

    setBackgroundColor(value) {
        this.material.uniforms.backgroundColor.value = value;
    }

    setColorMap(map) {
        this.colormap = map;
        this.material.uniforms.linkTex.value = map.getTexture();
    }

    setWidth(value) {
        this.width = value;
    }

    setColor(link, value) {
        var array = this.mesh.geometry.attributes.u.array;
        var index = 4 * link.link_id;
        array[index + 0] = array[index + 1] = array[index + 2] = array[index + 3] = value;
    }

    setGradient(link, from, to) {
        var array = this.mesh.geometry.attributes.u.array;
        var index = 4 * link.link_id;
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
        var p0 = cross.clone().multiplyScalar(link.source.getRadius() * this.width).add(sourcePos);
        var p1 = cross.clone().multiplyScalar(link.source.getRadius() * -this.width).add(sourcePos);
        var p2 = cross.clone().multiplyScalar(link.target.getRadius() * -this.width).add(targetPos);
        var p3 = cross.clone().multiplyScalar(link.target.getRadius() * this.width).add(targetPos);

        //Assign all vector components to buffer
        var p = this.mesh.geometry.attributes.position.array;
        var index = 8 * link.link_id;
        p[index + 0] = p0.x; p[index + 1] = p0.y;
        p[index + 2] = p1.x; p[index + 3] = p1.y;
        p[index + 4] = p2.x; p[index + 5] = p2.y;
        p[index + 6] = p3.x; p[index + 7] = p3.y;
    }

    containsPoint(link, position) {
        let p = this.mesh.geometry.attributes.position.array;
        let index = 8 * link.link_id;
        let curr = index + 6;
        let next = index;

        for(; next < index + 8; curr = next, next += 2) {
            let x1 = p[curr];
            let y1 = p[curr + 1];
            let x2 = p[next];
            let y2 = p[next + 1];

            let isLeft = ((x2 - x1) * (position.y - y1) - (position.x - x1) * (y2 - y1)) > 0;

            if(!isLeft) {
                return false;
            }
        }
        return true;
    }

    updatePositions() {
        this.mesh.geometry.attributes.position.needsUpdate = true;
    }

    fillContext(ctx) {
        let opacity = this.material.uniforms.linkAlpha.value;
        let array = this.mesh.geometry.attributes.position.array;
        let col = this.mesh.geometry.attributes.u.array;
        let temp = new THREE.Color();
        for(let i=0, j=0; i<array.length; i+=8, j+=4) {
            let grad = ctx.linearGradient(array[i + 2], -array[i + 3], array[i + 4], -array[i + 5]);
            temp.copy(this.colormap.getColor(col[j + 0]));
            temp.lerp(this.material.uniforms.backgroundColor.value, 1-opacity);
            grad.stop(0, "#" + temp.getHexString().toUpperCase());

            temp.copy(this.colormap.getColor(col[j + 2]));
            temp.lerp(this.material.uniforms.backgroundColor.value, 1-opacity);
            grad.stop(1 ,"#" + temp.getHexString().toUpperCase());

            ctx.moveTo(array[i + 0], -array[i + 1]);
            ctx.lineTo(array[i + 2], -array[i + 3]);
            ctx.lineTo(array[i + 4], -array[i + 5]);
            ctx.lineTo(array[i + 6], -array[i + 7]);
            ctx.closePath();
            ctx.fill(grad);
        }
    }
}
