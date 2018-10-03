const BAR_WIDTH = 187;
const STEP_WIDTH = 5;
let isMouseDown = false;

class gradientPicker {
    constructor(parent) {
        this.domElement = document.createElement("div");
        this.domElement.className = "gradient-container";
        parent.appendChild(this.domElement);

        this.bar = document.createElement("div");
        this.bar.className = "gradient-bar";
        this.domElement.appendChild(this.bar);

        this.input = document.createElement("input");
        this.input.className = "color-input";
        this.input.type = "text";
        this.domElement.appendChild(this.input);

        this.picker = new CP(this.input, false, this.domElement);
        this.picker.on("change", function(color) {
            self.selected.color = color;
            self.setBarGradient();
        });
        this.picker.enter();

        this.steps = [];
        this.addStep(0);

        var self = this;
        this.bar.addEventListener("dblclick", function(event) {
            self.addStep(event.clientX);
        });

        window.addEventListener("mouseup", function() {
            isMouseDown = false;
        });

        window.addEventListener("mousemove", function(event) {
            if(isMouseDown) {
                self.setStepTranslation(event.clientX);
            }
        });
    }
    
    addStep(left) {
        var self = this;
        var element = document.createElement("div");
        element.className = "gradient-step";
        this.bar.appendChild(element);
        
        var s = new step(element, "ff0000");
        element.addEventListener("mousedown", function() {
            self.setSelected(s);
            isMouseDown = true;
        });
        this.steps.push(s);
        this.setSelected(s);
        this.setStepTranslation(left);
    }

    setStepTranslation(left) {
        if(left >= 0 && left <= BAR_WIDTH - STEP_WIDTH) {
            this.selected.element.style.left = left + "px";
            this.selected.percentage = left/BAR_WIDTH * 100;
            this.setBarGradient();
        }
    }

    setSelected(s) {
        if(this.selected) {
            this.selected.element.style.outlineColor = "black";
        }
        this.picker.set("#" + s.color);
        s.element.style.outlineColor = "white";
        this.selected = s;
    }

    setBarGradient() {
        if(this.steps.length === 1) {
            this.bar.style.backgroundColor = "#" + this.steps[0].color;
        } else {
            var gradientCSS = "linear-gradient(to right";
            this.steps.sort(function(a, b){return a.percentage - b.percentage;});
            for(let i=0; i<this.steps.length; i++) {
                gradientCSS += ", #" + this.steps[i].color;
                gradientCSS += " " + this.steps[i].percentage + "%";
    
            }
            gradientCSS += ")";
            this.bar.style.backgroundImage = gradientCSS;
            console.log(gradientCSS);
        }
    }
}

class step {
    constructor(element, color, percentage=50.0) {
        this.color = color;
        this.element = element;
        this.percentage = percentage;
    }
}