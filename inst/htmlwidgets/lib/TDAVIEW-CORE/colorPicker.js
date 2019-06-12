/*
Public Events: OnColorChange
*/

class ColorPicker {
    constructor(parent, color="ff0000") {
        var self = this;

        this.eventSystem = new event();

        this.colorString = color;

        //Create container
        this.domElement = document.createElement("div");
        this.domElement.className = "gradient-container";
        parent.appendChild(this.domElement);

        //Create color picker
        this.input = document.createElement("input");
        this.input.className = "color-input";
        this.input.type = "text";
        this.domElement.appendChild(this.input);
        this.picker = new CP(this.input, false, this.domElement);
        this.picker.on("change", function(color) {
            this.colorString = color;
            self.eventSystem.invokeEvent("OnColorChange", color);
        });

        this.picker.set("#" + color);
        this.picker.enter();
    }

    setEnabled(value) {
        this.enabled = value;
    }

    getColor() {
        return this.colorString;
    }
}