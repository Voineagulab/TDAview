class MenuLabels {
    constructor(element) {
        this.domElement = document.createElement("span");
        this.domElement.innerHTML = this.generateHTML();
        element.appendChild(this.domElement);

        this._initLabelText();
        this._initLabelColor();
        this._initLabelSize();
    }

    generateHTML() {
        return /*html*/`
        <fieldset>
        <legend>Nodes</legend>
            <form name="labels">
            <input type="radio" name="labeltype" value="name" id="name">
            <label for="name">Given Name</label><br>
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
            <input type="text" id="labelSize" value="1"><br>
        </fieldset>
        `;
    }

    updateNamesEnabled(value) {
        document.getElementById("name").disabled = value;
        if(value) {
            document.getElementById("name").click();
        }
    }

    getSettings() {
        return {
            labelText: this._serializeLabelText(),
            labelColor: this._serializeLabelColor(),
            labelSize: this._serializeLabelSize()
        }
    }

    setSettings(obj) {
        this._deserializeLabelText(obj.labelText);
        this._deserializeLabelColor(obj.labelColor);
        this._deserializeLabelSize(obj.labelSize);
    }

    _initLabelText() {
        var self = this;

        document.getElementById("name").onclick = function() {
            self.OnLabelTextName();
        }

        document.getElementById("size").onclick = function() {
            self.OnLabelTextPoints();
        }

        document.getElementById("none").onclick = function() {
            self.OnLabelTextNone();
        }
    }

    _serializeLabelText() {
        return {
            source: document.getElementById("name").checked ? "name" : (document.getElementById("size").checked ? "size" : "none")
        }
    }

    _deserializeLabelText(obj) {
        switch(obj.source) {
            case "name": 
                document.getElementById("name").click();
                break;
            case "size":
                document.getElementById("size").click();
            default: 
                document.getElementById("none").click();
        }
    }

    _initLabelColor() {
        var self = this;

        this.labelColPicker = new ColorPicker(document.getElementById("label-color-picker-insert"))
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
     * Invoked when all labels are to read the given node name.
     */
    OnLabelTextName() {}
    
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

}