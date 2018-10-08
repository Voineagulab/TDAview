class forceGraph extends THREE.Group {
    constructor(data, adjacency, colormap, element, mouseToWorld) {
        super();
        this.initiallizing = true;

        //Cache element for mouse listening
        this.mouseToWorld = mouseToWorld;
        this.over = null;
        this.isMouseDown = false;
        this.mouseScreen = new THREE.Vector2();
        this.mouseWorld;
        
        //Create nodes as single mesh
        this.nodes = new Array(data.length);
        for(let i=0; i<data.length; i++) {
            this.nodes[i] = new node(i, "Node " + i, data[i], 0.0, colormap, this);
        }

        //Create links as separate meshes
        this.links = [];
        for(let i=0; i<adjacency[0].length; i++) {
            let row = adjacency[i];
            for(let j=0; j<row.length; j++) {
                if(row[j]) {
                    this.links.push(new link(this.nodes[i], this.nodes[j], colormap, this));
                }
            }
        }

        //Initiallise event system
        this.eventSystem = new event();
        this.eventSystem.addEventListener("onTick", this.updatePositions.bind(this));

        //Initiallise simulation
        this.simulation = d3.forceSimulation(this.nodes)
            .force("link", d3.forceLink(this.links))
            .force('center', d3.forceCenter())
            .force("charge", d3.forceManyBody().strength(-1000))
            .on("tick", function() {
                this.eventSystem.invokeEvent("onTick");
            }.bind(this))
            .on("end", function() {
                this.initiallizing = false;
                this.eventSystem.invokeEvent("onEnd");
            }.bind(this));

        element.addEventListener('mousedown', this.onMouseDown.bind(this));
        element.addEventListener('mousemove', this.onMouseMove.bind(this));
        element.addEventListener('mouseup', this.onMouseUp.bind(this));
    }

    onNodeDragStart() {
        this.simulation.alphaTarget(0.3).restart();
        this.initiallizing = false;
    }

    onNodeDrag() {
        this.over.fx = this.mouseWorld.x;
        this.over.fy = this.mouseWorld.y;
    }

    onNodeDragEnd() {
        this.simulation.alphaTarget(0);
        this.over.fx = this.over.fy = null;
    }

    onMouseDown() {
        this.isMouseDown = true;
        if(this.over) {
            this.onNodeDragStart();
        }
    }
    
    onMouseMove(event) {
        //Update stored values
        this.mouseScreen.x = event.clientX;
        this.mouseScreen.y = event.clientY;
        this.mouseWorld = this.mouseToWorld(this.mouseScreen);

        if(this.isMouseDown && this.over) {
            //Node already found
            this.onNodeDrag();
        } else {
            //Iterate over nodes checking if they are at world position
            for(let i=0; i<this.nodes.length; i++) {
                let targ = this.nodes[i].getPosition();
                let r = this.nodes[i].r;
                //Check if inside bounding box;
                if(this.mouseWorld.x >= targ.x - r && 
                    this.mouseWorld.x <= targ.x + r && 
                    this.mouseWorld.y >= targ.y - r && 
                    this.mouseWorld.y <= targ.y + r) {
                    //Check if inside circle
                    if(Math.pow(this.mouseWorld.x - targ.x, 2) + Math.pow(this.mouseWorld.y - targ.y, 2) <= r*r) {
                        this.over = this.nodes[i];
                        return;
                    }
                }
            }
            this.over = null;
        }
    }
    
    onMouseUp() {
        if(this.isMouseDown && this.over) {
            this.onNodeDragEnd();
        }
        this.isMouseDown = false;
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

    updateNodeColors() {
        for(var i=0; i<this.nodes.length; i++) {
            //TODO when pie/single are switchable
        }
    }

    updateLinkColors() {
        for(var i=0; i<this.links.length; i++) {
            this.links[i].updateColors();
        }
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