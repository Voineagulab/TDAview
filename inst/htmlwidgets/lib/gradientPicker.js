const CONTAINER_WIDTH = 185;
const BAR_WIDTH = 160;
const STEP_WIDTH = 5;
let gradMouseDown = false;

class gradientPicker {
    constructor(parent) {
        var self = this;

        this.color;

        this.eventSystem = new event();

        //Fixed disables user input and greys steps
        this.isFixed = false;

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
            self.color = color;
            if(self.steps.length == 0) {
                self.setColor();
            } else {
                self.selected.color = color;
                self.setBarGradient();
            }
            
        });
        this.picker.enter();

        this.steps = [];
        this.bar.addEventListener("dblclick", function(event) {
            if(!self.isFixed && self.steps.length > 1) {
                if(self.steps.length == 0) {
                    self.addStep(1 * CONTAINER_WIDTH/3);
                    self.addStep(2 * CONTAINER_WIDTH/3);
                } else {
                    self.addStep(event.clientX);
                }
                self.setBarGradient();
            }
        });

        this.barRectLeft = this.bar.getBoundingClientRect().left;

        //Drop step
        window.addEventListener("mouseup", function() {
            gradMouseDown = false;
        });

        //Move step even if mouse outside bar
        window.addEventListener("mousemove", function(event) {
            if(!self.isFixed && gradMouseDown) {
                self.setStepTranslation(self.selected, event.clientX);
                self.setBarGradient();
            }
        });
    }

    setStateSingle() {
        //Remove all steps
        while(this.steps.length) {
            this.removeStepAt(0);
        }
        this.isFixed = false;
        this.selected = undefined;
        this.setColor();
        this.picker.set("#" + this.color);
    }

    setStateGradient() {
        //Ensure there are at least 2 steps
        let i=1;
        while(this.steps.length < 2) {
            this.addStep(CONTAINER_WIDTH/3 * i++);
        }
        this.isFixed = false;
        this.setBarGradient();
    }

    setStateFixedGradient(count) {
        this.isFixed = true;

        //Ensure there are exactly count steps
        if(this.steps.length > count) {
            this.setSelected(this.steps[count-1]);
            while(this.steps.length > count) {
                this.removeStepAt(0);
            }
        } else {
            while(this.steps.length < count) {
                this.addStep(0);
            }
        }

        //Position all steps
        for(let i=0; i<this.steps.length; i++) {
            this.setStepTranslation(this.steps[i], CONTAINER_WIDTH/(count+1) * (i+1));
        }
        this.setBarGradient();
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
        var color = this.steps.length ? (Math.random()*0xFFFFFF<<0).toString(16) : this.color;
        var s = new step(this.counter++, element, color, left/BAR_WIDTH);
        element.addEventListener("mousedown", function(event) {
            self.setSelected(s);
            gradMouseDown = true;
            event.preventDefault();
        });

        //Double click on step to remove
        element.addEventListener("dblclick", function(event) {
            if(!self.isFixed && self.steps.length > 2) {
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
        this.setStepTranslation(s, left);
    }

    setStepTranslation(s, left) {
        left -= this.barRectLeft;
        if(left >= 0 && left <= BAR_WIDTH - STEP_WIDTH) {
            s.element.style.left = left + "px";
            s.percentage = left/BAR_WIDTH * 100;
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

    setColor() {
        //Set overall bar color since gradient requires more than one step
        this.bar.style.backgroundColor = "#" + this.color;
        this.bar.style.backgroundImage = "";
        this.eventSystem.invokeEvent("onColorChange", this.color);
    }

    setBarGradient() {
        //Generate ordered gradient using hex and percentage steps
        var gradientCSS = "linear-gradient(to right";
        this.steps.sort(function(a, b){return a.percentage - b.percentage;});

        if(this.isFixed) {
            //Create two css steps between each internal step
            var last = this.steps.length-1;
            for(var i=0; i<last; i++) {
                var p = " " + (this.steps[i].percentage + this.steps[i+1].percentage)/2 + "%";
                var c1 = ", #" + this.steps[i].color;
                var c2 = ", #" + this.steps[i+1].color;
                gradientCSS += c1 + p + c2 + p;
            }
            
        } else {
            //Create css step at each step
            for(let i=0; i<this.steps.length; i++) {
                gradientCSS += ", #" + this.steps[i].color;
                gradientCSS += " " + this.steps[i].percentage + "%";
            }
        }
        
        gradientCSS += ")";
        this.bar.style.backgroundImage = gradientCSS;
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