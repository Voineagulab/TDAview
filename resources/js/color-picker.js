
class ColorPicker {
    constructor(parent, color="ffffff") {
        var self = this;

        this.color = color;
        this.silent = true;

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
        this.setColor(this.color);
        this.picker.enter();
        this.picker.on("change", function(color) {
            if(!self.silent) {
                self.OnColorChange(color);
            }
            self.silent = false;
            self.color = color;
        });
    }

    getColor() {
        return this.color;
    }

    setColor(color) {
        this.silent = true;
        this.picker.set("#" + color);
        this.color = color;
    }


    //Overwrite this to get events
    OnColorChange(color) {}
}
