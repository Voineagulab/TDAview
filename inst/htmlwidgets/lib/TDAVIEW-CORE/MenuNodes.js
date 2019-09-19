class MenuNodes {
    constructor(element) {
        this.domElement = document.createElement("span");
        this.domElement.innerHTML = this.generateHTML();
        element.appendChild(this.domElement);

        this._initNodeColor();
        this._initNodeSize();
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
            <input type="radio" name="nodesize" value="continuous" id="continuoussize" />
            <label for="continuoussize">Variable</label><br>
            <input placeholder="Select:" list="continuoussizedatalist" name="continuoussizeinput" id="continuoussizeinput" autocomplete="off" style="width: 200px;" disabled>
            <datalist id="continuoussizedatalist">
            </datalist>
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
            size: this._serializeNodeSize()
        }
    }

    setSettings(obj) {
        this._deserializeNodeColor(obj.color);
        this._deserializeNodeSize(obj.size);
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
            obj.type = document.getElementById("contentsize").checked ? "content" : "none";
            
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
        }
    }
    
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