/*
Public Events: OnNodeSelect, OnNodeDeselect, OnTick, OnEnd
*/
class forceGraph extends THREE.Group {
    constructor(data, adjacency, labels, nodeColorMap, edgeColorMap) {
        super();
        var self = this;
        this.initiallizing = true;

        //Create selection mesh
        var selectionMesh = new THREE.Mesh(new THREE.CircleBufferGeometry(10, 64), new THREE.MeshBasicMaterial());
        selectionMesh.visible = false;
        selectionMesh.position.z = -1;
        selectionMesh.scale.set(0.11, 0.11, 1);

        function onNodeDragStart() {
            self.simulation.alphaTarget(0.3).restart();
            self.initiallizing = false;
        }
    
        function onNodeDrag(node, vector) {
            node.fx = vector.x;
            node.fy = vector.y;
        }
    
        function onNodeDragEnd(node) {
            self.simulation.alphaTarget(0);
            node.fx = node.fy = null;
        }

        function onNodeSelect(node) {
            self.eventSystem.invokeEvent("OnNodeSelect", node);
            selectionMesh.visible = true;
            node.mesh.add(selectionMesh);
        }

        function onNodeDeselect(node) {
            self.eventSystem.invokeEvent("OnNodeDeselect", node);
            selectionMesh.visible = false;
        }
        
        //Create nodes as single mesh
        node.intMaterial(nodeColorMap);
        this.nodes = new Array(data.length);
        for(let i=0; i<data.length; i++) {
            this.nodes[i] = new node(i, labels[i], data[i], 0.0, this);
            this.nodes[i].eventSystem.addEventListener("OnDragStart", onNodeDragStart);
            this.nodes[i].eventSystem.addEventListener("OnDrag", onNodeDrag);
            this.nodes[i].eventSystem.addEventListener("OnDragEnd", onNodeDragEnd);
            this.nodes[i].eventSystem.addEventListener("OnSelect", onNodeSelect);
            this.nodes[i].eventSystem.addEventListener("OnDeselect", onNodeDeselect);
        }

        //Create links as separate meshes
        this.links = [];
        link.initMaterial(edgeColorMap);
        for(let i=0; i<adjacency[0].length; i++) {
            let row = adjacency[i];
            for(let j=0; j<row.length; j++) {
                if(row[j]) {
                    this.links.push(new link(this.nodes[i], this.nodes[j], this));
                }
            }
        }

        //Initiallise event system
        this.eventSystem = new event();
        this.eventSystem.addEventListener("onTick", this.updatePositions.bind(this));

        //Initiallise simulation
        this.simulation = d3.forceSimulation(this.nodes)
            .force("link", d3.forceLink(this.links).strength(20 * 1/this.links.length))
            .force('center', d3.forceCenter())
            .force("charge", d3.forceManyBody().strength(-100).distanceMax(100).distanceMin(10))
            .on("tick", function() {
                this.eventSystem.invokeEvent("onTick");
            }.bind(this))
            .on("end", function() {
                this.initiallizing = false;
                this.eventSystem.invokeEvent("onEnd");
            }.bind(this));
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
        link.updateColorMap(colormap);
    }
    
    updatePositions() {
        //Update node positions
        for(var i=0; i<this.nodes.length; i++) {
            this.nodes[i].setPosition(this.nodes[i].x, this.nodes[i].y);
        }

        //Update link positions
        for(var i=0; i<this.links.length; i++) {
            this.links[i].setPositionFromNodes();
            this.links[i].updatePosition();
        }
    }
}