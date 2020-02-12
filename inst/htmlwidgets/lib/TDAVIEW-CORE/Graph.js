class Graph {
    /**
     * Creates an undirected, force layout graph using webgl
     * @param  {NodeInstance[]} nodes List of nodes to draw
     * @param  {[LinkInstance]} links List of links to draw
     * @param  {ColorMap} nodeColorMap 2D texture to use for node UVs
     * @param  {ColorMap} edgeColorMap 2D texture to use for edge UVs
     * @param  {Number} width Initial width of the renderer
     * @param  {Number} height Initial height of the renderer
     * @param  {Number} frustumSize Size of the camera's view frustum
     * @return {ForceGraph} A graph object
     */
    constructor(element, nodeColorMap, edgeColorMap, frustumSize=1000) {
        var self = this;

        this.isEmpty = true;

        this.domElement = document.createElement('div');
        this.domElement.setAttribute("id", "export");
        element.appendChild(this.domElement);

        this.width = this.domElement.clientWidth;
        this.height = this.domElement.clientHeight;

        this.nodeColorMap = nodeColorMap;
        this.edgeColorMap = edgeColorMap;

        this.renderer = new THREE.WebGLRenderer({antialias: true, alpha: true, preserveDrawingBuffer: true });
        this.renderer.context.disable(this.renderer.context.DEPTH_TEST);
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.setClearColor(0xffffff, 1.0);
        this.renderer.depth = false;
        this.renderer.sortObjects = false;

        this.labelRenderer = new THREE.CSS2DRenderer();
        this.labelRenderer.setSize(this.width, this.height);
        this.labelRenderer.domElement.setAttribute("id", "labelcanvas");

        this.domElement.appendChild(this.renderer.domElement);
        this.domElement.appendChild(this.labelRenderer.domElement);

        let aspect = this.width / this.height;
        this.camera = new THREE.OrthographicCamera(frustumSize*aspect/-2, frustumSize*aspect/2, frustumSize/2, frustumSize/-2, 1, 2000);
        this.camera.position.z = 400;

        this.fontScaleEdge = 1;
        this.fontScale = 1;
        this.fontZoom = 0;

        this.frustumSize = frustumSize;

        this.selectionMesh = new THREE.Mesh(new THREE.CircleBufferGeometry(10, 64), new THREE.MeshBasicMaterial());
        this.selectionMesh.visible = false;
        this.selectionMesh.position.z = -1;

        this.scene = new THREE.Scene();

        this.interactSystem = new InteractSystem(this.domElement, this.camera, this.width, this.height);
        this.interactSystem.OnCameraPan = function() {
            self.update();
        };
    }

    set(nodes, links) {
        var self = this;

        this.selectionMesh.visible = false;

        //Remove existing nodes and links - temporarily remove selection mesh to preserve order
        if(!this.isEmpty) {
            this.scene.remove(this.nodeRenderer);
            this.scene.remove(this.linkRenderer);
            this.scene.remove(this.selectionMesh);
            for(let i=0; i<this.labels.length; ++i) this.scene.remove(this.labels[i]);
            for(let i=0; i<this.edgeLabels.length; ++i) this.scene.remove(this.edgeLabels[i]);
            this.interactSystem.clearInteractSets();
        }

        this.nodes = nodes;
        this.links = links;
        this.shouldRender = false;
        this.shouldAutoZoom = true;
        this.selectedNode = undefined;
        this.initiallizing = true;

        this.labels = new Array(nodes.length);
        this.labelsVisible = true;
        for(let i=0; i<this.labels.length; i++) {
            let div = document.createElement('div');
            div.className = "unselectable label";
            this.labels[i] = new THREE.CSS2DObject(div);
            this.scene.add(this.labels[i]);
        }

        this.edgeLabels = new Array(links.length);
        this.edgeLabelsvisible = true;
        for(let i=0; i<this.edgeLabels.length; ++i) {
            let div = document.createElement('div');
            div.className = "unselectable label";
            this.edgeLabels[i] = new THREE.CSS2DObject(div);
            this.scene.add(this.edgeLabels[i]);
        }

        this.nodeRenderer = new NodeRenderer(this.nodeColorMap, nodes.length);
        this.linkRenderer = new LinkRenderer(this.edgeColorMap, links.length);

        var nodeSet = new InteractSet(nodes, true, true);
        var linkSet = new InteractSet(links, false, true);

        nodeSet.ObjectContainsPoint = function(node, position) {
            return node.containsPoint(position);
        };

        nodeSet.ObjectDragCenter = function(node, center) {
            center.x = node.x;
            center.y = node.y;
            return center;
        };

        nodeSet.OnObjectDragStart = function(node) {
            self.initiallizing = false;
            self.update();
        };

        nodeSet.OnObjectDrag = function(node, vector) {
            node.fixed = true;
            node.px = vector.x;
            node.py = vector.y;
            self.simulation.resume();
            self.update();
        };

        nodeSet.OnObjectDragEnd = function(node) {
            node.fixed = false;
        };

        nodeSet.OnObjectSelect = function(node) {
            self.selectedNode = node;
            self.selectionMesh.visible = true;
            self._updateSelectionScale();
            self._applySelectionPosition();
            self.update();
            self.OnNodeSelect(node);
        };

        nodeSet.OnObjectDeselect = function(node) {
            self.selectedNode = undefined;
            self.selectionMesh.visible = false;
            self.update();
            self.OnNodeDeselect(node);
        }

        linkSet.ObjectContainsPoint = function(link, position) {
            return self.linkRenderer.containsPoint(link, position);
        }

        linkSet.OnObjectSelect = function(link) {
            self.OnLinkSelect(link);
        }

        linkSet.OnObjectDeselect = function(link) {
            self.OnLinkDeselect(link);
        }

        this.interactSystem.addInteractSet(nodeSet);
        this.interactSystem.addInteractSet(linkSet);

        //Initiallise nodes in a circle for consistent layouts
        for(let i=0; i<nodes.length; i++) {
            let rad = i/nodes.length * 2 * Math.PI;
            nodes[i].x = Math.sin(rad);
            nodes[i].y = Math.cos(rad);
        }

        //Initiallise simulation
        this.simulation = d3.layout.force()
            .gravity(0.1)
            .distance(30)
            .charge(-300)
            .nodes(nodes)
            .links(links)
            .on("tick", function() {
                self.forEachNode(n => self.setLabelPosition(n));
                self._applyNodePositions();
                self.applyLinkPositions();
                self._applySelectionPosition();

                if(this.initiallizing && this.shouldAutoZoom) {
                    this._setZoom(0.0);
                }
                this.update();
            }.bind(this))
            .on("end", function() {
                this.initiallizing = false;
                this.shouldAutoZoom = false;
            }.bind(this));

        this.scene.add(this.linkRenderer);
        this.scene.add(this.selectionMesh);
        this.scene.add(this.nodeRenderer);

        var animate = function() {
            window.requestAnimationFrame(animate);
            if(self.shouldRender) {
                self._render();
            }
        }

        this.simulation.start();
        window.requestAnimationFrame(animate);
        this.isEmpty = false;
    }

    /**
     * Sets the graph to be rendered
     */
    update() {
        this.shouldRender = true;
    }

    /**
     * Performs an operation on each node of the graph
     * @param  {Function} func The predicate to apply
     */
    forEachNode(func) {
        this.nodes.forEach(func);
    }

    forEachEdge(func){
      this.links.forEach(func);
    }

    OnNodeSelect(node) {}

    OnNodeDeselect(node) {}

    OnLinkSelect(link) {}

    OnLinkDeselect(link) {};

    /**
     * Obtains the node positions for backup purposes
     * @return  {THREE.Vector2[]} Node positions
     */
    getNodePositions() {
        var pos = new Array(this.nodes.length);
        for(let i=0; i<this.nodes.length; i++) {
            pos[i] = new THREE.Vector2(this.nodes[i].x, this.nodes[i].y);
        }
        return pos;
    }

    /**
     * Sets node positions re-runs layout algorithm for restoration purposes
     * @return  {THREE.Vector2[]} Node positions
     */
    setNodePositions(pos) {
        for(let i=0; i<this.nodes.length; i++) {
            this.nodes[i].x = pos[i].x;
            this.nodes[i].y = pos[i].y;
        }
        self.simulation.start();
    }

    /**
     * Sets dimensions of the renderer and related DOM elements using client width/height
     */
    resize() {
        this.width = this.domElement.clientWidth;
        this.height = this.domElement.clientHeight;
        let aspect = this.width / this.height;
        this.camera.left = - this.frustumSize * aspect/2;
        this.camera.right = this.frustumSize * aspect/2;
        this.camera.top = this.frustumSize/2;
        this.camera.bottom = -this.frustumSize/2;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.labelRenderer.setSize(this.width, this.height);
        if(!this.isEmpty) this._updatePixelZoom();
        this.interactSystem.resize(this.width, this.height);
        this._render();
    }

    /**
     * Sets the camera zoom amount and interrupts automatic zooming.
     * @param  {Number} value Zoom value in the range [0.0, 1.0]
     */
    setZoom(value) {
        this.shouldAutoZoom = false;
        this._setZoom(Math.pow(value, 2));
    }

     /**
     * Gets the camera zoom amount
     * @return {Number} Zoom value in the range [0.0, 1.0]
     */
    getZoom() {
        let uncapped = (this.camera.zoom - this._getZoomMin())/(this._getZoomMax() + this._getZoomMin());
        return Math.max(1.0, Math.min(0.0, uncapped));
    }

    /**
     * Sets the color map for all nodes
     * @return {ColorMap} A color map
     */
    setNodeColorMap(colormap) {
        this.nodeColorMap = colormap;
        this.nodeRenderer.setColorMap(colormap);
    }

     /**
     * Sets the color map to be used by all links
     * @return {ColorMap} A color map
     */
    setLinkColorMap(colormap) {
        this.edgeColorMap = colormap;
        this.linkRenderer.setColorMap(colormap);
    }

     /**
     * Sets the mapped color of a specific node
     * @param {NodeInstance} node The node to be modified
     * @param {Number} value A UV color in the range [0.0, 1.0]
     */
    setNodeColor(node, value) {
        node.setColor(value);
        this.nodeRenderer.setColorBuffer(node);
    }

    /**
     * Sets the mapped color of a specific node
     * @param {NodeInstance} node The node to be modified
     * @param {Number[]} percentages Angles at which each color starts in the range [0.0, 1.0]
     * @param {Number[]} colors UV colors in the range [0.0, 1.0]
     */
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

    /**
     * Sets radius of a specific node
     * @param {NodeInstance} node The node to be modified
     * @param {Number} value The new radius
     */
    setNodeScale(node, value) {
        value = this.nodeRenderer.calculateScale(value);
        node.setRadius(value);
        this.nodeRenderer.setScaleBuffer(node);
    }

    /**
     * Sets alpha of all links
     * @param {Number} value The new alpha
     */
    setLinkAlpha(value) {
        this.linkRenderer.setAlpha(value);
    }

    setLinkScale(value) {
        this.linkRenderer.setWidth(value);
        this.forEachEdge(link => this.setEdgeLabelPosition(link));
        this.update();
    }

    /**
     * Sets background color of the graph
     * @param {THREE.Color} color The new color
     */
    setBackgroundColor(color) {
        this.renderer.setClearColor(color);
        this.linkRenderer.setBackgroundColor(color);
    }

    /**
     * Copies the color/pie changes to GPU memory
     */
    updateNodeColors() {
        this.nodeRenderer.updateColors();
    }

    /**
     * Copies the scale changes to GPU memory
     */
    updateNodeScales() {
        this.nodeRenderer.updateScales();
        this._updateSelectionScale();
        this.forEachNode(n => this.setLabelPosition(n));
    }

    updateLinkColors() {
        this.linkRenderer.updateColors();
    }

    /**
     * Sets font size of all labels
     * @param {Number} value The new font size
     */
    setFontScale(value) {
        this.fontScale = value;
        this._updateFontSize();
        this.forEachNode(n => this.setLabelPosition(n));
        this.update();
    }

    setFontScaleEdge(value) {
        this.fontScaleEdge = value;
        this._updateFontSizeEdge();
        this.forEachEdge(l => this.setEdgeLabelPosition(l));
        this.update();
    }

    /**
     * Updates all link positions to match nodes and copies these changes to GPU memory
     */
    applyLinkPositions() {
        for(var i=0; i<this.links.length; i++) {
            this.linkRenderer.setPositionFromNodes(this.links[i]);
        }
        this.linkRenderer.updatePositions();
        this.forEachEdge(link => this.setEdgeLabelPosition(link));
    }

    /**
     * Sets the label position to match associated node layout
     * @param {NodeInstance} node The node whose label should be modified
     */
    setLabelPosition(node) {
        var label = this.labels[node.id];
        if(label) {
            if(node.neighbors.length == 0) {
                label.position.x = node.x;
                label.position.y = node.y + (2 * node.getRadius() + this.fontScale/2);
            } else {
                let n = new Array(node.neighbors.length);
                for(let i=0; i<n.length; i++) {
                    n[i] = new NodeNeighbor(node.neighbors[i], Math.PI + Math.atan2(node.neighbors[i].x - node.x, node.neighbors[i].y - node.y));
                }
                n.sort((a, b) => a.angle - b.angle);

                let difference = 2 * Math.PI - n[n.length-1].angle + n[0].angle;
                let midAngle = n[n.length-1].angle + difference/2 - 2 * Math.PI;

                for(let i=0, d=0; i<(n.length-1); i++) {
                    d = n[i+1].angle - n[i].angle;
                    if(d > difference) {
                        midAngle = n[i].angle + d/2;
                        difference = d;
                    }
                }
                midAngle -= Math.PI

                //Interplates text alignment based on length and angle - letters should be approximately square//Assumes letters are approximately square
                label.position.x = node.x + Math.sin(midAngle) * (2 * node.getRadius() + this.fontScale/4 * (this.labels[node.id].element.textContent.length + 2));
                label.position.y = node.y + Math.cos(midAngle) * (2 * node.getRadius() + this.fontScale/2);
            }
        }
    }

    setLabelVisibilities(visible) {
        if(visible != this.labelsVisible) {
            this.labelsVisible = visible;
            for(let i=0; i<this.labels.length; i++) {
                this.labels[i].element.classList.toggle("hiddenlabel");
            }
        }
    }

    setLabelColors(color) {
      this.labelColor = "#" + color.toUpperCase();
        for(let i=0; i<this.labels.length; i++) {
            this.labels[i].element.style.color = this.labelColor;
        }
    }

    setLabelText(node, text) {
        this.labels[node.id].element.textContent = text;
        this.setLabelPosition(node);
    }

    setEdgeLabelPosition(link) {
      let label = this.edgeLabels[link.link_id];

      var sourcePos = new THREE.Vector3(link.source.x, link.source.y, 0);
      var targetPos = new THREE.Vector3(link.target.x, link.target.y, 0);
      var midPos = sourcePos.clone().add(targetPos).divideScalar(2);
      var cross = new THREE.Vector2(-(targetPos.y - sourcePos.y), targetPos.x - sourcePos.x).normalize();
      var p = cross.clone().multiplyScalar((link.source.getRadius() + link.target.getRadius())/2 * this.linkRenderer.width + this.fontScale/4 * (label.element.textContent.length + 2)).add(midPos);

      label.position.x = p.x;
      label.position.y = p.y;
    }

    setEdgeLabelVisibilities(visible) {
      if(visible != this.edgeLabelsVisible) {
        this.edgeLabelsVisible = visible;
        for(let i=0; i<this.edgeLabels.length; ++i){
          this.edgeLabels[i].element.classList.toggle("hiddenlabel");
        }
      }
    }

    setEdgeLabelColors(color) {
      this.edgeLabelColor = "#"+ color.toUpperCase();
      for(let i=0; i<this.edgeLabels.length; ++i) {
        this.edgeLabels[i].element.style.color = this.edgeLabelColor;
      }
    }

    setEdgeLabelText(link, text) {
      this.edgeLabels[link.link_id].element.textContent = text;
      this.setEdgeLabelPosition(link);
    }

    /**
     * Sets the color of the selection graphic
     * @param {String} color
     */
    setSelectColor(color) {
        this.selectionMesh.material.color.setHex("0x" + color);
    }

    setLinkGradientsFromNodes() {
        this.links.forEach(l => this.linkRenderer.setGradientFromNodes(l));
    }

    fillContext(ctx) {
        if(this.isEmpty) return;

        this.linkRenderer.fillContext(ctx);
        this.nodeRenderer.fillContext(ctx);

        if(this.labelsVisible && this.labels.length > 0) {
          ctx.fontSize(this.fontScale);
          ctx.fillColor(this.labelColor);
          for(let i=0; i<this.labels.length; ++i) {
            ctx.text(this.labels[i].element.textContent, this.labels[i].position.x, -this.labels[i].position.y);
          }
        }

        if(this.edgeLabelsVisible && this.edgeLabels.length > 0) {
          ctx.fontSize(this.fontScaleEdge);
          ctx.fillColor(this.edgeLabelColor);
          for(let i=0; i<this.edgeLabels.length; ++i) {
            ctx.text(this.edgeLabels[i].element.textContent, this.edgeLabels[i].position.x, -this.edgeLabels[i].position.y);
          }
        }
    }

    _render() {
        this.renderer.render(this.scene, this.camera);
        this.labelRenderer.render(this.scene, this.camera);
        this.shouldRender = false;
    }

    /**
     * Updates all node positions to match simulation and copies these changes to GPU memory
     */
    _applyNodePositions() {
        for(var i=0; i<this.nodes.length; i++) {
            this.nodeRenderer.setOffsetBuffer(this.nodes[i]);
        }
        this.nodeRenderer.updateOffsets();
        this.forEachNode(n => this.setLabelPosition(n));
    }

    /**
     * Updates the selection mesh position to match the currently selected node
     */
    _applySelectionPosition() {
        if(this.selectedNode) {
            this.selectionMesh.position.x = this.selectedNode.x;
            this.selectionMesh.position.y = this.selectedNode.y;
        }
    }

    /**
     * Updates the selection mesh radius to match the currently selected node
     */
    _updateSelectionScale() {
        if(this.selectedNode) {
            let scale = this.selectedNode.getRadius() * 0.125;
            this.selectionMesh.scale.set(scale, scale, 1);
        }
    }

    /**
     * Gets the maximum dimensions of the graph
     * @returns {THREE.Box3} A bounding box
     */
    _getBoundingBox(margin) {
        var box = new THREE.Box3();
        for(let i=0; i<this.nodes.length; i++) {
            box.expandByPoint(this.nodes[i].getPosition()); //TODO something in model matrix is broken? expandByObject AND setFromObject don't work
        }
        box.expandByScalar(margin);
        return box;
    }

    /**
     * Updates zoom compensation value used internally to calculate label screen size
     */
    _updateFontZoom() {
        this.fontZoom = this.camera.zoom;
        this._updateFontSize();
        this._updateFontSizeEdge();
    }

    _updateFontSize() {
      this.fontSize = this.fontScale * this.fontZoom;
        for(let i=0; i<this.labels.length; i++) {
            this.labels[i].element.style.fontSize = this.fontSize + "px";
        }
    }

    _updateFontSizeEdge() {
        this.fontSizeEdge = this.fontScaleEdge * this.fontZoom;
        for(let i=0; i<this.edgeLabels.length; i++) {
            this.edgeLabels[i].element.style.fontSize = this.fontSizeEdge + "px";
        }
    }

     /**
     * Sets zoom compensation value used internally to calculate node screen size
     */
    _updatePixelZoom() {
        this.nodeRenderer.setPixelZoom(this.camera.zoom * window.innerHeight * window.devicePixelRatio / this.frustumSize * 2);
    }

    /**
     * Sets the camera zoom amount
     * @param  {Number} value Zoom value in the range [0.0, 1.0]
     */
    _setZoom(value) {
        this.camera.zoom = THREE.Math.lerp(this._getZoomMin(), this._getZoomMax(), value);
        this.camera.updateProjectionMatrix();
        this._updatePixelZoom();
        this._updateFontZoom();
    }

    /**
     * Calculates the "furthest away" zoom the camera should be, used for internal interpolation
     * @return {Number} A raw zoom value
     */
    _getZoomMin() {
        var box = this._getBoundingBox(200);
        let aspect = this.width / this.height;
        if(aspect > 1.0 ) return (this.frustumSize) / ( box.max.y - box.min.y );
        return (this.frustumSize) / ( box.max.x - box.min.x );
    }

    /**
     * Calculates the "closest" zoom the camera should be, used for internal interpolation
     * @return {Number} A raw zoom value
     */
    _getZoomMax() {
        return 50;
    }
}
