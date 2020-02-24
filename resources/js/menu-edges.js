class MenuEdge {
    constructor(element) {
        this.domElement = document.createElement("span");
        this.domElement.innerHTML = this.generateHTML();
        element.appendChild(this.domElement);

        this._initEdgeColor();
        this._initEdgeStyle();
        this._initLabelSource();
        this._initLabelColor();
        this._initLabelSize();
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
            Thickness
            <br>
            <input type="range" min="0" max="100" value="10" class="slider" id="edge-width-slider"><br>
        </fieldset>
        <fieldset>
        <legend>Label Source</legend>
            <input type="radio" name="labeledgetype" value="none" id="labeledgenone" checked>
            <label for="labelnone">None</label><br>

            <input type="radio" name="labeledgetype" value="common" id="labeledgecommon">
            <label for="labelcontent">Points in Common</label><br>
            </datalist>
        </fieldset>
        <fieldset>
        <legend>Label Color</legend>
            <input type="radio" name="labelEdgeColor" value="background" id="labeledgecolorbackground" class="label-edge-color-radio" checked/>
            <label for="labelcolorbackground">From Background</label><br>
            <input type="radio" name="labelEdgeColor" value="uniform" id="labeledgecolor" class="label-edge-color-radio" />
            <label for="labeledgecolor">Uniform</label><br><br>
            <div id="label-edge-color-picker-insert"></div>
        </fieldset>
        <fieldset>
        <legend>Label Size</legend>
            <input type="text" id="labelEdgeSize" value="10"><br>
        </fieldset>
        `;
    }

    getSettings() {
        return {
            edgeColor: this._serializeEdgeColor(),
            edgeStyle: this._serializeEdgeStyle(),
            edgeLabelSource: this._serializeLabelSource(),
            edgeLabelColor: this._serializeLabelColor(),
            edgeLabelSize: this._serializeLabelSize()
        }
    }

    setSettings(obj) {
        this._deserializeEdgeColor(obj.edgeColor);
        this._deserializeEdgeStyle(obj.edgeStyle);
        this._deserializeLabelSource(obj.edgeLabelSource);
        this._deserializeLabelColor(obj.edgeLabelColor);
        this._deserializeLabelSize(obj.edgeLabelSize);
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

    _initLabelSource() {
      var self = this;

      document.getElementById("labeledgenone").onclick = function() {
        self.OnLabelTextNone();
      };

      document.getElementById("labeledgecommon").onclick = function() {
        self.OnLabelTextCommon();
      }
    }

    _serializeLabelSource() {
        return {
            source: this._getRadioIndex(document.getElementsByName("labeledgetype"))
        };
    }

    _deserializeLabelSource(obj) {
        document.getElementsByName("labeledgetype")[obj.source].click();
    }

    _initLabelColor() {
      var self = this;

      this.labelColPicker = new ColorPicker(document.getElementById("label-edge-color-picker-insert"), "ff0000");
      var labelcolor = document.getElementById("labeledgecolor");

      this.labelColPicker.OnColorChange = function(color) {
        if(!labelcolor.checked) {
          labelcolor.click();
        }
        self.OnLabelColorChange(color);
      };

      labelcolor.onclick = function() {
        self.OnLabelColorUniform();
        self.OnLabelColorChange(self.labelColPicker.getColor());
      }

      document.getElementById("labeledgecolorbackground").onclick = function() {
        self.OnLabelColorFromBackground();
      }
    }

    _serializeLabelColor() {
      return {
        color: this.labelColPicker.getColor(),
        source: this._getRadioIndex(document.getElementsByName("labelEdgeColor"))
      };
    }

    _deserializeLabelColor(obj) {
        this.labelColPicker.setColor(obj.color);
        document.getElementsByName("labelEdgeColor")[obj.source].click();

    }

    _initLabelSize() {
        var self = this;
        var labelSizeInput = document.getElementById("labelEdgeSize");
        labelSizeInput.onchange = function(){
            self.OnLabelSizeChange(labelSizeInput.value)
        }
    }

    _serializeLabelSize() {
        return {
            value: document.getElementById("labelEdgeSize").value
        }
    }

    _deserializeLabelSize(obj) {
        var labelSizeInput = document.getElementById("labelEdgeSize");
        labelSizeInput.value = obj.value;
        labelSizeInput.onchange();
    }

    _getRadioIndex(radios) {
        for(let i=1; i<radios.length; i++) {
            if(radios[i].checked) return i;
        }
        return 0;
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

    OnLabelTextNone() {}

    OnLabelTextCommon() {}

    OnLabelColorChange() {}

    OnLabelColorUniform() {}

    OnLabelColorFromBackground() {}

    OnLabelSizeChange(value) {}
}
