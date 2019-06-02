/*
Public Events: OnColorChange
*/

class colorPicker {
    constructor(parent) {
        var self = this;

        this.eventSystem = new event();

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
            self.eventSystem.invokeEvent("OnColorChange", color);
        });
        this.picker.enter();
    }

    setEnabled(value) {
        this.enabled = value;
    }
}