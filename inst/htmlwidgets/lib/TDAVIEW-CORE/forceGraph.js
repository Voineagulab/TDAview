/*
Public Events: OnNodeSelect, OnNodeDeselect, OnTick, OnEnd
*/
class forceGraph extends THREE.Group {
    constructor(data, adjacency, nodeColorMap, edgeColorMap, selectColor="ffffff") {
        super();
        var self = this;
        this.initiallizing = true;
        this.fontSize = 1;
        this.fontZoom = 0;

        //Create selection mesh
        this.selectionMesh = new THREE.Mesh(new THREE.CircleBufferGeometry(10, 64), new THREE.MeshBasicMaterial());
        this.selectionMesh.visible = false;
        this.selectionMesh.position.z = -1;
        this.selectedNode = undefined;
        this.selectionMesh.material.color.setHex("0x" + selectColor);

        function onNodeDragStart() {
            self.simulation.alphaTarget(0.7).restart();
            self.initiallizing = false;
        }
    
        function onNodeDrag(node, vector) {
            node.fx = vector.x;
            node.fy = vector.y;
            node.updateLabelPosition();
        }
    
        function onNodeDragEnd(node) {
            self.simulation.alphaTarget(0);
            node.fx = node.fy = null;
        }

        function onNodeSelect(node) {
            self.selectedNode = node;
            self.selectionMesh.visible = true;
            self.updateSelectionScale();
            self.updateSelectionPosition();
            self.eventSystem.invokeEvent("OnNodeSelect", node);
        }

        function onNodeDeselect(node) {
            self.eventSystem.invokeEvent("OnNodeDeselect", node);
            self.selectedNode = undefined;
            self.selectionMesh.visible = false;
        }

        //Create nodes
        this.nodes = new Array(data.length);
        for(let i=0; i<data.length; i++) {
            this.nodes[i] = new NodeInstance(i, data[i], this);
            this.nodes[i].eventSystem.addEventListener("OnDragStart", onNodeDragStart);
            this.nodes[i].eventSystem.addEventListener("OnDrag", onNodeDrag);
            this.nodes[i].eventSystem.addEventListener("OnDragEnd", onNodeDragEnd);
            this.nodes[i].eventSystem.addEventListener("OnSelect", onNodeSelect);
            this.nodes[i].eventSystem.addEventListener("OnDeselect", onNodeDeselect);
        }
        
        //TODO: assumes Mapper output is symmetric (random output was not)
        this.links = [];
        for(let i=0, curr=0; i<adjacency[0].length; i++) {
            let row = adjacency[i];
            for(let j=0; j<i; j++) {
                if(row[j]) {
                    this.links.push(new LinkInstance(curr++, this.nodes[i], this.nodes[j]));
                    this.nodes[i].addNeighbor(this.nodes[j]);
                    this.nodes[j].addNeighbor(this.nodes[i]);
                }
            }
        }

        this.nodeRenderer = new NodeRenderer(nodeColorMap, data.length);
        this.linkRenderer = new LinkRenderer(edgeColorMap, this.links.length);

        this.add(this.linkRenderer);
        this.add(this.selectionMesh);
        this.add(this.nodeRenderer);

        //Initiallise event system
        this.eventSystem = new event();
        this.eventSystem.addEventListener("onTick", function() {
            self.updateSelectionPosition();
            self.applyNodePositions();
            self.applyLinkPositions();
        });

        //Initiallise nodes in a circle for consistent layouts
        for(let i=0; i<this.nodes.length; i++) {
            let rad = i/this.nodes.length * 2 * Math.PI;
            this.nodes[i].x = Math.sin(rad);
            this.nodes[i].y = Math.cos(rad);
        }

        //Initiallise simulation
        this.simulation = d3.forceSimulation(this.nodes)
            .force("link", d3.forceLink(this.links))
            .force('center', d3.forceCenter())
            .force("charge", d3.forceManyBody().strength(-10))
            .on("tick", function() {
                this.eventSystem.invokeEvent("onTick");
                this.updateNodeLabelPositions();
                /*need some event other than drag to update visible rects and avoid selector hack
                due to zoom, handles should really be in the HUD scene only!
                for(let i=0; i<this.nodes.length; i++) {
                    this.nodes[i].eventSystem.invokeEvent("OnDrag", this.nodes[i], this.nodes[i].getPosition());
                }*/
            }.bind(this))
            .on("end", function() {
                this.initiallizing = false;
                this.eventSystem.invokeEvent("onEnd");
            }.bind(this));
    }

    updateSelectionPosition() {
        if(this.selectedNode) {
            this.selectionMesh.position.x = this.selectedNode.x;
            this.selectionMesh.position.y = this.selectedNode.y;
        }
    }

    updateSelectionScale() {
        if(this.selectedNode) {
            let scale = this.selectedNode.getRadius() * 0.125;
            this.selectionMesh.scale.set(scale, scale, 1);
        }
    }

    getBoundingBox() {
        var box = new THREE.Box3();
        for(let i=0; i<this.nodes.length; i++) {
            //TODO something in model matrix is broken? expandByObject AND setFromObject don't work
            box.expandByPoint(this.nodes[i].getPosition());
        }
        //TODO fix hardcoded margin
        box.expandByScalar(100);
        return box;
    }

    setNodeColorMap(colormap) {
        node.updateColorMap(colormap);
    }

    setLinkColorMap(colormap) {
        this.linkRenderer.setColorMap(colormap);
    }

    setNodeColor(node, value) {
        node.setColor(value);
        this.nodeRenderer.setColorBuffer(node);
    }

    setNodePie(node, percentages, colors) {
        this.nodeRenderer.setPieBuffer(node, percentages, colors);

        let max = 0;
        for(let i=1; i<percentages.length; i++) {
            if(percentages[i] > percentages[max]) {
                max = i;
            }
        }
        node.setColor(colors[max]);
    }

    setNodeScale(node, value) {
        value = this.nodeRenderer.calculateScale(value);
        node.setRadius(value);
        this.nodeRenderer.setScaleBuffer(node);
    }

    setNodeAlpha(value) {
        this.nodeRenderer.setAlpha(value);
    }

    setLinkAlpha(value) {
        this.linkRenderer.setAlpha(value);
    }

    setBackgroundColor(value) {
        this.linkRenderer.setBackgroundColor(value);
    }

    setLODZoom(zoom) {
        this.nodeRenderer.setLODZoom(zoom);
    }

    setPixelZoom(height) {
        this.nodeRenderer.setPixelZoom(height);
    }

    updateNodeColors() {
        this.nodeRenderer.updateColors();
    }

    updateNodeScales() {
        this.nodeRenderer.updateScales();
        this.updateSelectionScale();
    }

    updateNodeLabelPositions() {
        for(let i=0; i<this.nodes.length; i++) {
            this.nodes[i].updateLabelPosition();
        }
    }

    updateNodeLabelSizes() {
        for(let i=0; i<this.nodes.length; i++) {
            this.nodes[i].setLabelSize(this.fontZoom * this.fontSize);
        }
    }

    setFontZoom(value) {
        this.fontZoom = value;
    }

    setFontSize(value) {
        this.fontSize = value;
    }

    setLinkWidth(value) {
        this.linkRenderer.setWidth(value);
    }
    
    setLinkColor(link, color) {
        this.linkRenderer.setColor(link, color);
    }

    setLinkGradientFromNodes(link) {
        this.linkRenderer.setGradientFromNodes(link);
    }

    updateLinkColors() {
        this.linkRenderer.updateColors();
    }

    applyNodePositions() {
        for(var i=0; i<this.nodes.length; i++) {
            this.nodeRenderer.setOffsetBuffer(this.nodes[i]);
        }
        this.nodeRenderer.updateOffsets();
    }

    applyLinkPositions() {
        for(var i=0; i<this.links.length; i++) {
            this.linkRenderer.setPositionFromNodes(this.links[i]);
        }
        this.linkRenderer.updatePositions();
    }

    setSelectColor(color) {
        this.selectionMesh.material.color.setHex("0x" + color);
    }
}