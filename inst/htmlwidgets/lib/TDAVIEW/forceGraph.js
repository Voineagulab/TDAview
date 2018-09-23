class forceGraph extends THREE.Group {
    constructor(data, adjacency, texture) {
        super();
        
        //Create nodes
        this.nodes = node.generateInstances(data, texture, this);

        //Create links
        this.links = [];
        for(let i=0; i<adjacency[0].length; i++) {
            let row = adjacency[i];
            for(let j=0; j<row.length; j++) {
                if(row[j]) {
                    this.links.push(new link(this.nodes[i], this.nodes[j], texture, this));
                }
            }
        }
        console.log(adjacency);
        console.log(this.links);

        //Initiallise event system
        this.eventSystem = new event();
        this.eventSystem.addEventListener("onTick", this.updatePositions, this);

        //Initiallise simulation
        var self = this;
        this.simulation = d3.forceSimulation(this.nodes)
            .force("link", d3.forceLink(this.links))
            .force('center', d3.forceCenter())
            .force("charge", d3.forceManyBody().strength(-1000))
            .on("tick", () => {self.eventSystem.invokeEvent("onTick")})
            .on("end", () => {self.eventSystem.invokeEvent("onEnd")});
    }

    setSimulationAlphaTarget(value) {
        this.simulation.alphaTarget(value);
    }

    restartSimulation() {
        this.simulation.restart();
    }

    updateNodeColors() {
        node.updateColors();
    }

    updateNodeScales() {
        node.updateScales();
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
        node.updatePositions();

        //Update link positions
        for(var i=0; i<this.links.length; i++) {
            this.links[i].setPositionFromNodes();
            this.links[i].updatePosition();
        }
    }
}