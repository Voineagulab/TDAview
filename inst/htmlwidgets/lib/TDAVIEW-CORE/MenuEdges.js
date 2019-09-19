class MenuEdge {
    constructor(element) {
        this.domElement = document.createElement("span");
        this.domElement.innerHTML = this.generateHTML();
        element.appendChild(this.domElement);

        this._initEdgeColor();
        this._initEdgeStyle();
    }

    generateHTML() {
        return /*html*/`
        <fieldset>
        <legend>Color</legend>
            <input type="radio" name="edgeColor" value="nodes" id="edgecolornode" class="edge-color-meta-radio" checked/>
            <label for="edgecolornode">From Nodes</label><br>
            <input type="radio" name="edgeColor" value="uniform" id="edgecolor" class="edge-color-meta-radio"/>
            <label for="edgecolor">Uniform</label><br><br>
            <div id="edge-color-picker-insert"></div>
        </fieldset>
        <fieldset>
        <legend>Style</legend>
            Opacity
            <br>
            <input type="range" min="0" max="100" value="100" class="slider" id="edge-alpha-slider"><br>
            Scale
            <br>
            <input type="range" min="0" max="100" value="10" class="slider" id="edge-width-slider"><br>
        </fieldset>
        `;
    }

    getSettings() {
        return {
            edgeColor: this._serializeEdgeColor(),
            edgeStyle: this._serializeEdgeStyle()
        }
    }

    setSettings(obj) {
        this._deserializeEdgeColor(obj.edgeColor);
        this._deserializeEdgeStyle(obj.edgeStyle);
    }

    _initEdgeColor() {
        var self = this;

        var edgecolor = document.getElementById("edgecolor");
        edgecolor.onclick = function() {
            self.OnEdgeColorUniform();
        }

        document.getElementById("edgecolornode").onclick = function() {
            self.OnEdgeColorFromNodes();
            self.OnEdgeColorChange(self.picker.getColor());
        };

        this.picker = new ColorPicker(document.getElementById("edge-color-picker-insert"), "ff0000");
        this.picker.OnColorChange = function(color) {
            if(!edgecolor.checked) {
                edgecolor.checked = true;
                edgecolor.onclick();
            }
            self.OnEdgeColorChange(color);
        };
    }

    _serializeEdgeColor() {
        return {
            fromNodes: document.getElementById("edgecolornode").checked,
            color: this.picker.getColor()
        }
    }

    _deserializeEdgeColor(obj) {
        if(obj.fromNodes) {
            document.getElementById("edgecolornode").click();
        } else {
            document.getElementById("edgecolor").click();
        }
        this.picker.setColor(obj.color); //this triggers event
    }

    _initEdgeStyle() {
        var self = this;

        var edgeAlphaSlider = document.getElementById("edge-alpha-slider");
        edgeAlphaSlider.oninput = function() {
            self.OnEdgeAlphaChange(edgeAlphaSlider.value/100);
        };

        var edgeWidthSlider = document.getElementById("edge-width-slider");
        edgeWidthSlider.oninput = function() {
            self.OnEdgeWidthChange(edgeWidthSlider.value/100);
        };
    }

    _serializeEdgeStyle() {
        return {
            alpha: document.getElementById("edge-alpha-slider").value,
            width: document.getElementById("edge-width-slider").value
        }
    }

    _deserializeEdgeStyle(obj) {
        document.getElementById("edge-alpha-slider").value = obj.alpha;
        document.getElementById("edge-alpha-slider").oninput();

        document.getElementById("edge-width-slider").value = obj.width;
        document.getElementById("edge-width-slider").oninput();
    }

    /**
     * Invoked when all edges are to be blended with the background by this amount.
     * @param {Number} alpha a value in the range [0.0, 1.0]
     */
    OnEdgeAlphaChange(alpha) {}

    /**
     * Invoked when all edges are to be multiplied by this value, 
     * where 1.0 stretches them to node radii.
     * @param {Number} width a value in the range [0.0, 1.0]
     */
    OnEdgeWidthChange(width) {}

    /**
     * Invoked when all edges are to be colored by a single uniform.
     * The actual uniform will be supplied in the OnEdgeColorChange event.
     */
    OnEdgeColorUniform() {}

    /**
     * Invoked when all edges are to be colored by the node map.
     */
    OnEdgeColorFromNodes() {}

    /**
     * Invoked when all edges are to be colored by a newly selected uniform.
     * @param {String} color a six character hex color
     */
    OnEdgeColorChange(color) {}
}