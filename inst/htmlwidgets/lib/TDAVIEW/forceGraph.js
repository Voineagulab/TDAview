class forceGraph extends THREE.Group {
    constructor(data, adjacency, texture, width, height) {
        super();

        //Setup pixel picking
        this.pickScene = new THREE.Scene();
        this.pixelBuffer = new Uint8Array(4);
        this.pickRenderTarget = new THREE.WebGLRenderTarget(width, height);
        this.pickRenderTarget.texture.generateMipmaps = false;
        this.pickRenderTarget.texture.minFilter = THREE.NearestFilter;
        
        //Create nodes
        this.nodes = node.generateInstances(data, texture, this, this.pickScene, 128);

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

        //Initiallise event system
        this.eventSystem = new event();
        this.eventSystem.addEventListener("onTick", this.updatePositions, this);
        this.eventSystem.addEventListener("onTick", node.computeBoundingBox);

        //Initiallise simulation
        var self = this;
        this.simulation = d3.forceSimulation(this.nodes)
            .force("link", d3.forceLink(this.links))
            .force('center', d3.forceCenter())
            .force("charge", d3.forceManyBody().strength(-1000))
            .on("tick", () => {self.eventSystem.invokeEvent("onTick")})
            .on("end", () => {self.eventSystem.invokeEvent("onEnd")});
    }

    //If graph is huge, this could be slow
    findSearch(worldPos) {
        for(let i=0; i<this.nodes.length; i++) {
            let targ = this.nodes[i].getPosition();
            let r = this.nodes[i].r;
            if(worldPos.x > targ.x - r && 
                worldPos.x < targ.x + r && 
                worldPos.y > targ.y - r && 
                worldPos.y < targ.y + r) {
                    //In bounding box
                    if(Math.pow(worldPos.x - targ.x, 2) + Math.pos(worldPos.y - targ.y, 2) < Math.pow(r, 2)) {
                        //In bounding circle
                        return this.nodes[i];
                    }
            }
        }
        return null;
    }

    //Raytracing doesn't work for instanced geometry! 
    //Taken from https://threejs.org/examples/webgl_interactive_instances_gpu.html
    //Adds an additional render pass / overhead but is proportional to screen size rather than node count
    findBuffer(renderer, camera, mouse) {
        renderer.render(this.pickScene, camera, this.pickRenderTarget);
        renderer.readRenderTargetPixels(
            this.pickRenderTarget,
            mouse.x,
            this.pickRenderTarget.height - mouse.y,
            1,
            1,
            this.pixelBuffer
        );

        //Interpret pixel as node index
        var index = ((this.pixelBuffer[0] << 16) | (this.pixelBuffer[1] << 8) | (this.pixelBuffer[2])) - 1;
          
        if(index > 0) {
            var self = this;
            self.eventSystem.invokeEvent("onNodeHover", this.nodes[index]);;
        }
    }

    updateFindBufferSize(width, height) {
        this.pickRenderTarget.setSize(width, height, false);
    }

    setSimulationAlphaTarget(value) {
        this.simulation.alphaTarget(value);
    }

    restartSimulation() {
        this.simulation.restart();
    }

    getBoundingBox() {
        return node.getBoundingBox();
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