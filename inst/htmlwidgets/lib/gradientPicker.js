const BAR_WIDTH = 185;
const STEP_WIDTH = 5;
let gradMouseDown = false;

class gradientPicker {
    constructor(parent, gradientChangeCallback) {
        var self = this;

        //Counter for unique step ids
        this.counter = 0;

        //Create container
        this.domElement = document.createElement("div");
        this.domElement.className = "gradient-container";
        parent.appendChild(this.domElement);

        //Create bar
        this.bar = document.createElement("div");
        this.bar.className = "gradient-bar";
        this.domElement.appendChild(this.bar);

        //Create color picker
        this.input = document.createElement("input");
        this.input.className = "color-input";
        this.input.type = "text";
        this.domElement.appendChild(this.input);
        this.picker = new CP(this.input, false, this.domElement);
        this.picker.on("change", function(color) {
            self.selected.color = color;
            self.setBarGradient();
            gradientChangeCallback(color);
        });
        this.picker.enter();

        this.steps = [];
        this.addStep(BAR_WIDTH/2);

        //Create step
        this.bar.addEventListener("dblclick", function(event) {
            self.addStep(event.clientX);
        });

        this.barRectLeft = this.bar.getBoundingClientRect().left;

        //Drop step
        window.addEventListener("mouseup", function() {
            gradMouseDown = false;
        });

        //Move step even if mouse outside bar
        window.addEventListener("mousemove", function(event) {
            if(gradMouseDown) {
                self.setStepTranslation(event.clientX);
            }
        });
    }

    addStep(left) {
        var self = this;

        //Add step to DOM
        var element = document.createElement("div");
        element.className = "gradient-step";
        this.bar.appendChild(element);
        
        //Click on step to select
        var s = new step(this.counter++, element, "ff0000", left/BAR_WIDTH);
        element.addEventListener("mousedown", function(event) {
            self.setSelected(s);
            gradMouseDown = true;
            self.setStepTranslation(event.clientX);
            event.preventDefault();
        });

        //Double click on step to remove
        element.addEventListener("dblclick", function(event) {
            if(self.steps.length > 1) {
                for(let i=0; i<self.steps.length; i++) {
                    if(self.steps[i].id == s.id) {
                        //Remove step
                        self.steps.splice(i, 1);
                        self.bar.removeChild(s.element);

                        //Set selected to first
                        self.setSelected(self.steps[0]);

                        //Recalculate gradient
                        self.setBarGradient();
                        break;
                    }
                }
            }

            //Prevent bar underneath from creating step
            event.stopPropagation();
        });

        this.steps.push(s);
        this.setSelected(s);
        this.setStepTranslation(left);
    }

    setStepTranslation(left) {
        left -= this.barRectLeft;
        if(left >= 0 && left <= BAR_WIDTH - STEP_WIDTH) {
            this.selected.element.style.left = left + "px";
            this.selected.percentage = left/BAR_WIDTH * 100;
            this.setBarGradient();
        }
    }

    setSelected(s) {
        if(this.selected) {
            this.selected.element.style.borderColor = "black";
        }
        this.picker.set("#" + s.color);
        s.element.style.borderColor = "white";
        this.selected = s;
    }

    setBarGradient() {
        console.log(this.steps);
        if(this.steps.length == 1) {
            //Set overall bar color since gradient requires more than one step
            this.bar.style.backgroundColor = "#" + this.steps[0].color;
            this.bar.style.backgroundImage = "";
        } else {
            //Generate ordered gradient using hex and percentage steps
            var gradientCSS = "linear-gradient(to right";
            this.steps.sort(function(a, b){return a.percentage - b.percentage;});
            for(let i=0; i<this.steps.length; i++) {
                gradientCSS += ", #" + this.steps[i].color;
                gradientCSS += " " + this.steps[i].percentage + "%";
    
            }
            gradientCSS += ")";
            this.bar.style.backgroundImage = gradientCSS;
        }
    }
}

class step {
    constructor(id, element, color, percentage) {
        this.id = id;
        this.color = color;
        this.element = element;
        this.percentage = percentage;
    }
}