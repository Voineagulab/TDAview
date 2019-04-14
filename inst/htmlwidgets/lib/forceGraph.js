/*
Public Events: OnNodeSelect, OnNodeDeselect, OnTick, OnEnd
*/
class forceGraph extends THREE.Group {
    constructor(data, adjacency, labels, nodeColorMap, edgeColorMap, selectColor="ffffff") {
        super();
        var self = this;
        this.initiallizing = true;

        //Create selection mesh
        this.selectionMesh = new THREE.Mesh(new THREE.CircleBufferGeometry(10, 64), new THREE.MeshBasicMaterial());
        this.add(this.selectionMesh);
        this.selectionMesh.visible = false;
        this.selectionMesh.position.z = -1;
        this.selectedNode = undefined;
        this.selectionMesh.material.color.setHex("0x" + selectColor);

        function onNodeDragStart() {
            self.simulation.alphaTarget(0.3).restart();
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

        this.nodeRenderer = new NodeRenderer(nodeColorMap, this.nodes, this);
        this.linkRenderer = new LinkRenderer(edgeColorMap, this.nodes, adjacency, this);


        this.links = this.linkRenderer.links;

        //Initiallise event system
        this.eventSystem = new event();
        this.eventSystem.addEventListener("onTick", function() {
            self.updateSelectionPosition();
            self.applyNodePositions();
            self.applyLinkPositions();
        });

        //Initiallise simulation
        this.simulation = d3.forceSimulation(this.nodes)
            .force("link", d3.forceLink(this.linkRenderer.links).strength(20 * 1/this.links.length))
            .force('center', d3.forceCenter())
            .force("charge", d3.forceManyBody().strength(-100).distanceMax(100).distanceMin(10))
            .on("tick", function() {
                this.eventSystem.invokeEvent("onTick");
                this.updateNodeLabelPositions();
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