class MenuNodes {
    constructor(element) {
        this.domElement = document.createElement("span");
        this.domElement.innerHTML = this.generateHTML();
        element.appendChild(this.domElement);

        this._initNodeColor();
        this._initNodeSize();

        this._initLabelText();
        this._initLabelColor();
        this._initLabelSize();
    }

    generateHTML() {
        return /*html*/`
        <fieldset>
        <legend>Color</legend>
            <input type="radio" name="nodecolor" value="uniform" id="nodecoloruniform" checked/>
            <label for="nodecoloruniform">Uniform</label><br>
            <input type="radio" name="nodecolor" value="variable" id="nodecolorvariable"/>
            <label for="nodecolorvariable">Variable</label><br>
            <input placeholder="Select:" list="variablecolordatalist" name="variablecolorinput" id="variablecolorinput" autocomplete="off" style="width: 200px;" disabled>
            <br>
            <datalist id="variablecolordatalist">
            </datalist>
            <br>
            <div id="node-color-picker-insert"></div>
        </fieldset>
        <fieldset>
        <legend>Size</legend>
            <input type="radio" name="nodesize" value="none" id="nonesize" checked/>
            <label for="nonesize">Uniform</label><br>
            <input type="radio" name="nodesize" value="content" id="contentsize" />
            <label for="contentsize">Points</label><br>
            <input type="radio" name="nodesize" value="content" id="degreesize" />
            <label for="degreesize">Degree</label><br>
            <input type="radio" name="nodesize" value="continuous" id="continuoussize" />
            <label for="continuoussize">Variable</label><br>
            <input placeholder="Select:" list="continuoussizedatalist" name="continuoussizeinput" id="continuoussizeinput" autocomplete="off" style="width: 200px;" disabled>
            <datalist id="continuoussizedatalist">
            </datalist>
        </fieldset>
        <fieldset>
        <legend>Nodes</legend>
            <form name="labels">
            <input type="radio" name="labeltype" value="size" id="size">
            <label for="size">Points</label><br>
            <input type="radio" name="labeltype" value="none" id="none" checked>
            <label for="none">None</label>
            </form>
        </fieldset>
        <fieldset>
        <legend>Color</legend>
            <input type="radio" name="labelColor" value="background" id="labelcolorbackground" class="label-color-meta-radio" checked/>
            <label for="labelcolorbackground">From Background</label><br>
            <input type="radio" name="labelColor" value="uniform" id="labelcolor" class="label-color-meta-radio" />
            <label for="labelcolor">Uniform</label><br><br>
            <div id="label-color-picker-insert"></div>
        </fieldset>
        <fieldset>
        <legend>Size</legend>
            <input type="text" id="labelSize" value="10"><br>
        </fieldset>
        `;
    }

    updateVariableNames(continuousNames, categoricalNames) {
        this.continuousNames = continuousNames;
        this.categoricalNames = categoricalNames;
        document.getElementById("variablecolordatalist").innerHTML = /*html*/`${continuousNames.concat(categoricalNames).map(v => `<option value="${v}">`).join('')}`;
        document.getElementById("continuoussizedatalist").innerHTML = /*html*/`${continuousNames.map(v => `<option value="${v}">`).join('')}`;
    }

    getSettings() {
        return {
            color: this._serializeNodeColor(),
            size: this._serializeNodeSize(),
            labelText: this._serializeLabelText(),
            labelColor: this._serializeLabelColor(),
            labelSize: this._serializeLabelSize()
        }
    }

    setSettings(obj) {
        this._deserializeNodeColor(obj.color);
        this._deserializeNodeSize(obj.size);
        this._deserializeLabelText(obj.labelText);
        this._deserializeLabelColor(obj.labelColor);
        this._deserializeLabelSize(obj.labelSize);
    }

    _initNodeColor() {
        var self = this;

        this.nodeGradPicker = new GradientPicker(document.getElementById("node-color-picker-insert"));

        this.nodeGradPicker.OnGradientChange = function(steps) {
            self.OnNodeGradientChange(steps);
        };

        var variablecolorinput = document.getElementById("variablecolorinput");
        this.variablecolorinputold = undefined;
        document.getElementById("nodecoloruniform").onclick = function() {
            self.OnNodeColorUniform();
            self.nodeGradPicker.setState(STATE_SINGLE);
            self.nodeGradPicker.updateBarGradient();
            variablecolorinput.disabled = true;

        };

        document.getElementById("nodecolorvariable").onclick = function() {
            variablecolorinput.disabled = false;
            if(self.variablecolorinputold) {
                variablecolorinput.value = self.variablecolorinputold;
                variablecolorinput.onchange();
            }
        };

        variablecolorinput.onchange = function() {
            if(self.continuousNames.indexOf(variablecolorinput.value) >= 0) {
                self.nodeGradPicker.setState(STATE_GRADIENT);
                self.OnNodeColorContinuous(variablecolorinput.value);
                variablecolorinput.placeholder = self.variablecolorinputold = variablecolorinput.value;
            } else if(self.categoricalNames.indexOf(variablecolorinput.value) >= 0) {
                let count = self.OnNodeColorCategorical(variablecolorinput.value);
                self.nodeGradPicker.setState(STATE_FIXED, count);
                variablecolorinput.placeholder = self.variablecolorinputold = variablecolorinput.value;
            }
            self.nodeGradPicker.updateBarGradient();
            variablecolorinput.value = "";
        };

        this.nodeGradPicker.OnColorChange = function(color) {
            self.OnNodeColorChange(color);
        };
    }

    _serializeNodeColor() {
        var obj = {};
        obj.variable = this.variablecolorinputold;
        if(document.getElementById("nodecoloruniform").checked) {
            obj.type = "uniform";
        } else {
            obj.type = "variable";
        }
        obj.colors = this.nodeGradPicker.getSettings();
        return obj;
    }

    _deserializeNodeColor(obj) {
        this.nodeGradPicker.setSettings(obj.colors);

        document.getElementById("variablecolorinput").value = "";
        document.getElementById("variablecolorinput").placeholder = "Select: ";

        //Load variable - need to do this even if uniform is currently selected
        this.variablecolorinputold  = obj.variable;
        if(obj.variable) {
            document.getElementById("nodecolorvariable").click();
        }

        if(obj.type == "uniform") {
            document.getElementById("nodecoloruniform").click();
        }
    }

    _initNodeSize() {
        var self = this;

        var sizedatainput = document.getElementById("continuoussizeinput");
        this.sizedatainputold = undefined;
        document.getElementById("nonesize").onclick = function() {
            sizedatainput.disabled = true;
            self.OnNodeSizeUniform();
        };

        document.getElementById("contentsize").onclick = function() {
            sizedatainput.disabled = true;
            self.OnNodeSizePoints();
        };

        document.getElementById("degreesize").onclick = function() {
            sizedatainput.disabled = true;
            self.OnNodeSizeDegree();
        };

        document.getElementById("continuoussize").onclick = function() {
            sizedatainput.disabled = false;
            if(self.sizedatainputold) {
                sizedatainput.value = self.sizedatainputold;
                sizedatainput.onchange();
            }
        };

        sizedatainput.onchange = function() {
            if(self.continuousNames.indexOf(sizedatainput.value) >= 0) {
                self.OnNodeSizeContinuous(sizedatainput.value)
                sizedatainput.placeholder = self.sizedatainputold = sizedatainput.value;
            }
            sizedatainput.value = "";
        };
    }

    _serializeNodeSize() {
        var obj = {};
        obj.variable = this.sizedatainputold;
        if(document.getElementById("continuoussize").checked) {
            obj.type = "continuous";
        } else {
            obj.type = document.getElementById("contentsize").checked ? "content" : (document.getElementById("degreesize").checked ? "degree" : "none");
        }
        return obj;
    }

    _deserializeNodeSize(obj) {
        document.getElementById("continuoussizeinput").value = "";
        document.getElementById("continuoussizeinput").placeholder = "Select: ";


        this.sizedatainputold = obj.variable;
        if(obj.variable) {
            document.getElementById("continuoussize").click();
        }

        if(obj.type == "content") {
            document.getElementById("contentsize").click();
        } else if(obj.type == "none") {
            document.getElementById("nonesize").click();
        } else if(obj.type == "degree") {
            document.getElementById("degreesize").click();
        }
    }

    _initLabelText() {
        var self = this;

        document.getElementById("size").onclick = function() {
            self.OnLabelTextPoints();
        }

        document.getElementById("none").onclick = function() {
            self.OnLabelTextNone();
        }
    }

    _serializeLabelText() {
        return {
            source: (document.getElementById("size").checked ? "size" : "none")
        }
    }

    _deserializeLabelText(obj) {
        switch(obj.source) {
            case "size":
                document.getElementById("size").click();
                break;
            default:
                document.getElementById("none").click();
        }
    }

    _initLabelColor() {
        var self = this;

        this.labelColPicker = new ColorPicker(document.getElementById("label-color-picker-insert"));
        var labelcolor = document.getElementById("labelcolor");

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

        document.getElementById("labelcolorbackground").onclick = function() {
            self.OnLabelColorFromBackground();
        }
    }

    _serializeLabelColor() {
        return {
            source: document.getElementById("labelcolor").checked ? "uniform" : "background",
            color: this.labelColPicker.getColor(),
        }
    }

    _deserializeLabelColor(obj) {
        if(obj.source == "uniform") {
            document.getElementById("labelcolor").click();
        } else {
            document.getElementById("labelcolorbackground").click();
        }
        this.labelColPicker.setColor(obj.color);
    }

    _initLabelSize() {
        var self = this;
        var labelSizeInput = document.getElementById("labelSize");
        labelSizeInput.onchange = function(){
            self.OnLabelSizeChange(labelSizeInput.value)
        }
    }

    _serializeLabelSize() {
        return {
            value: document.getElementById("labelSize").value
        }
    }

    _deserializeLabelSize(obj) {
        document.getElementById("labelSize").value = obj.value;
        document.getElementById("labelSize").onchange();
    }

    /**
     * Invoked when all labels are to read the node point count.
     */
    OnLabelTextPoints() {}

    /**
     * Invoked when all labels are to be hidden.
     */
    OnLabelTextNone() {}

    /**
     * Invoked when all labels are to be colored to contrast automatically with the background.
     */
    OnLabelColorFromBackground() {}

    /**
     * Invoked when all edges are to be colored by a single uniform.
     * The actual uniform will be supplied in the OnLabel ColorChange event.
     */
    OnLabelColorUniform() {}

    /**
     * Invoked when all labels are to be colored by a newly selected uniform.
     * @param {String} color a six character hex color
     */
    OnLabelColorChange(color) {}

    /**
     * Invoked when all labels are to be scaled by a newly selected uniform.
     * @param {Number} size the new font size
     */
    OnLabelSizeChange(size){}

    /**
     * Invoked when all nodes are to be scaled by a single uniform.
     * The actual uniform is currently constant and cannot be changed
     */
    OnNodeSizeUniform() {}

    /**
     * Invoked when nodes are to be scaled by the number of data points they contain.
     */
    OnNodeSizePoints() {}

    /**
     * Invoked when nodes are to be scaled by the number of adjacent nodes
     */
    OnNodeSizeDegree() {}

    /**
     * Invoked when nodes are to be scaled by the mean of a contained continuous variable.
     * @param {String} name the name of a continuous or categorical variable
     * @returns {Boolean} whether name was valid
     */
    OnNodeSizeContinuous(name) {return false}

    /**
     * Invoked when all nodes are to be colored by a single uniform.
     * The actual uniform will be supplied in the OnNodeColorChange event.
     */
    OnNodeColorUniform() {}

    /**
     * Invoked when nodes are to be colored by
     * @param {String} name the name of a categorical variable
     * @returns {Number} the number of categories
     */
    OnNodeColorCategorical(name) {}

    /**
     * Invoked when nodes are to be colored by
     * @param {String} name the name of a continuous variable
     */
    OnNodeColorContinuous(name) {}

    /**
     * Invoked when all nodes are to be colored by a newly selected uniform.
     * @param {String} color a six character hex color
     */
    OnNodeColorChange(color) {}

    /**
     * Invoked when nodes are to be colored by a newly edited gradient.
     * @param {Step[]} steps an array of steps
     */
    OnNodeGradientChange(steps) {}
}
