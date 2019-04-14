const LEGEND_WIDTH = 500;
const BAR_HEIGHT = 10;
const COLUMN_HEIGHT = 50;
const COLUMN_GAP = 0.25;

const STYLE_NONE = 0;
const STYLE_BAR = 1;
const STYLE_COLUMN = 2;
const STYLE_PIE = 3;

class MultiLegend extends Scalable2D {
    constructor(colorMap, parent, x, y, textColor="ffffff") {
        super(parent);
        this.colorMap = colorMap;
        this.group = new THREE.Group();
        this.group.position.set(x-80, y+80, 0);
        parent.add(this.group);

        this.meshes = [];
        this.labels = [];

        this.meshUsed = 0;
        this.labelUsed = 0;

        this.style = STYLE_NONE;
        this.visible = true;

        this.textColor = textColor;

        this.bounds = new THREE.Box2();

        this.eventSystem.addEventListener("OnDrag", function(self, vector) {
            self.group.position.set(vector.x + self.boundsWidth()/2, vector.y - self.boundsHeight()/2, 0);
        });
    }

    setMeshPool(count) {
        for(let i=count; i < this.meshes.length; i++) {
            this.meshes[i].visible = false;
        }

        while(this.meshes.length < count) {
            let geometry = new THREE.PlaneGeometry(1, 1);
            let mesh = new THREE.Mesh(geometry, this.colorMap.material);
            this.meshes.push(mesh);
            this.group.add(mesh);
        }

        if(this.visible) {
            for(let i=0; i < count; i++) {
                this.meshes[i].visible = true;
            }
        }

        this.meshUsed = count;
    }

    setLabelPool(count) {
        for(let i=count; i < this.labels.length; i++) {
            this.labels[i].element.style.display = "none";
        }

        while(this.labels.length < count) {
            let div = document.createElement('div');
            div.className = "unselectable label";
            div.style.color = "#" + this.textColor;
            let label = new THREE.CSS2DObject(div);
            this.labels.push(label);
            this.group.add(label);
        }

        if(this.visible) {
            for(let i=0; i < count; i++) {
                this.labels[i].element.style.display = "";
            }
        }

        this.labelUsed = count;
    }

    setPie(labels, count) {
        this.setMeshPool(count);
        this.setLabelPool(count);
        for(let i=0; i<count; i++) {
            this.meshes[i].scale.set(50, 50, 1);
            this.meshes[i].position.set(-LEGEND_WIDTH, 80 * i, 1);
            this.meshes[i].geometry.faceVertexUvs[0][0][0] = this.meshes[i].geometry.faceVertexUvs[0][0][1] = this.meshes[i].geometry.faceVertexUvs[0][1][0].set(i/(count-1), 1);
            this.meshes[i].geometry.faceVertexUvs[0][0][2] = this.meshes[i].geometry.faceVertexUvs[0][1][1] = this.meshes[i].geometry.faceVertexUvs[0][1][2].set(i/(count-1), 1);
            this.meshes[i].geometry.uvsNeedUpdate = true;

            this.labels[i].element.textContent = labels[i];
            this.labels[i].position.set(-LEGEND_WIDTH + 100, 80 * i, 1);
        }
        this.style = STYLE_PIE;
    }

    setBar(min, max) {
        this.setMeshPool(1);
        this.meshes[0].geometry.faceVertexUvs[0][0][0] = this.meshes[0].geometry.faceVertexUvs[0][0][1] = this.meshes[0].geometry.faceVertexUvs[0][1][0].set(0, 1);
        this.meshes[0].geometry.faceVertexUvs[0][0][2] = this.meshes[0].geometry.faceVertexUvs[0][1][1] = this.meshes[0].geometry.faceVertexUvs[0][1][2].set(1, 1);
        this.meshes[0].geometry.uvsNeedUpdate = true;

        this.meshes[0].scale.set(LEGEND_WIDTH, 20, 1);
        this.meshes[0].position.set(-LEGEND_WIDTH/2, 10, 1);

        this.bounds.min.set(-LEGEND_WIDTH, 0);
        this.bounds.max.set(0, 20);

        this.setLabelPool(2);
        this.labels[0].element.textContent = min.toFixed(2);
        this.labels[1].element.textContent = max.toFixed(2);

        this.labels[0].position.set(-LEGEND_WIDTH, -10, 0);
        this.labels[1].position.set(0, -10, 0);
    }

    setColumn(heights, min, max, count) {
        var minHeight = Infinity;
		var maxHeight = -Infinity;
		for(let i=0; i<heights.length; i++) {
			if(heights[i] > maxHeight) maxHeight = heights[i];
			else if(heights[i] < minHeight) minHeight = heights[i];
		}

        let columnWidth = LEGEND_WIDTH / count;
        let scaledColumnWidth = columnWidth * COLUMN_GAP;
        
        this.setMeshPool(count);
        for(let i=0; i<count; i++) {
            this.meshes[i].geometry.faceVertexUvs[0][0][0] = this.meshes[i].geometry.faceVertexUvs[0][0][1] = this.meshes[i].geometry.faceVertexUvs[0][1][0].set(i/(count+1), 1);
            this.meshes[i].geometry.faceVertexUvs[0][0][2] = this.meshes[i].geometry.faceVertexUvs[0][1][1] = this.meshes[i].geometry.faceVertexUvs[0][1][2].set((i+1)/(count+1), 1);
            this.meshes[i].geometry.uvsNeedUpdate = true;

            let h = (1 + (heights[i] - minHeight)/(maxHeight - minHeight)) * COLUMN_HEIGHT;
            this.meshes[i].scale.set(scaledColumnWidth, h, 0);
			this.meshes[i].position.set(i * columnWidth - LEGEND_WIDTH, h/2, 1);
        }

        this.setLabelPool(2);
        this.labels[0].element.textContent = min;
        this.labels[1].element.textContent = max;

        this.labels[0].position.set(-LEGEND_WIDTH, -10, 0);
        this.labels[1].position.set(0, -10, 0);

        this.style = STYLE_COLUMN;
    }

    setNone() {
        this.setMeshPool(0);
        this.setLabelPool(0);
    }

    setVisible(value) {
        this.visible = value;
        for(let i=0; i < this.meshUsed; i++) {
            this.meshes[i].visible = value;
        }
        for(let i=0; i<this.labelUsed; i++) {
            this.labels[i].element.style.display = value ? "" : "none";
        }
    }

    setTextColor(color) {
        this.textColor = color;
    }

    boundsContains(vector) {
        let temp = vector.clone().sub(this.group.position);
		return this.bounds.containsPoint(temp);
    }

    boundsCenter() {
        let center = new THREE.Vector2();
        return this.bounds.getCenter(center).add(this.group.position);
    }

    boundsWidth() {
        return this.bounds.max.x - this.bounds.min.x;
    }

    boundsHeight() {
        return this.bounds.max.y - this.bounds.min.y;
    }
}