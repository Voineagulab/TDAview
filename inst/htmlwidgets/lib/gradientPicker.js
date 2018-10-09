const BAR_WIDTH = 185;
const STEP_WIDTH = 5;
let gradMouseDown = false;

class gradientPicker {
    constructor(parent, gradientChangeCallback) {
        var self = this;

        this.eventSystem = new event();

        //Fixed disables user input and greys steps
        this.isFixed = false;

        //Quantisation disables gradient interpolation by inserting additional steps
        this.isQuantised = false;

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
            if(!this.isFixed && gradMouseDown) {
                self.setStepTranslation(event.clientX);
            }
        });
    }

    setQuantised(value) {
        this.isQuantised = value;
        this.setBarGradient();
    }

    setEquidistant(value) {
        this.isFixed = value;
        if(value) {
            for(let i=0; i<this.steps.length; i++) {
                this.setStepTranslation(this.steps[i], i/this.steps.length * BAR_WIDTH);
            }
        }
    }

    setStepCount(value) {
        for(let i=value - this.steps.length; i>0; i--) {
            this.addStep();
        }

        for(i=this.steps.length - value; i>0; i--) {
            this.removeStepAt(i);
        }
    }

    removeStepAt(index) {
        this.bar.removeChild(this.steps[index].element);
        this.steps.splice(index, 1);
    }

    addStep(left=0) {
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
            event.preventDefault();
        });

        //Double click on step to remove
        element.addEventListener("dblclick", function(event) {
            if(self.steps.length > 1) {
                for(let i=0; i<self.steps.length; i++) {
                    if(self.steps[i].id == s.id) {
                        //Remove step
                        self.removeStepAt(i);

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

                if(this.isQuantised && i+1 < this.steps.length) {
                    gradientCSS += ", #" + this.steps[i+1].color;
                    gradientCSS += " " + this.steps[i].percentage + "%";
                }
    
            }
            gradientCSS += ")";
            this.bar.style.backgroundImage = gradientCSS;
        }
        this.eventSystem.invokeEvent("onGradientChange", this.steps);
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