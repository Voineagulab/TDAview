/*
Public Events: OnColorChange, OnGradientChange
*/

const STATE_UNDEFINED = 0;
const STATE_SINGLE = 1;
const STATE_GRADIENT = 2;
const STATE_FIXED = 3;

const CONTAINER_WIDTH = 184;
const BAR_WIDTH = 160;
const STEP_WIDTH = 5;


class GradientPicker {
    constructor(parent) {
        var self = this;

        this.gradMouseDown = false;

        this.colorString;
        this.state = STATE_UNDEFINED;
        this.nextUniqueID = 0;

        this.eventSystem = new event();

        //Create container
        this.domElement = document.createElement("div");
        this.domElement.className = "gradient-container";
        parent.appendChild(this.domElement);

        //Create instructions
        this.instruction = document.createElement("div");
        this.domElement.appendChild(this.instruction);

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
            if(self.state != STATE_SINGLE) {
                self.selected.color.set("#" + color);
            } else {
                self.colorString = color;
            }
            self.updateBarGradient();
        });
        this.picker.enter();

        this.fixedSteps = [];
        this.steps = [];

        this.bar.addEventListener("dblclick", function(event) {
            if(self.state == STATE_GRADIENT) {
                var s = self.createStep(self.steps);
                self.setStepTranslation(s, event.clientX);
                self.setSelected(s);
                self.updateBarGradient();
            }
        });
        
        this.barRectLeft = this.bar.getBoundingClientRect().left;

        window.addEventListener("mouseup", function() {
            self.gradMouseDown = false;
        });

        window.addEventListener("mousemove", function(event) {
            if(self.state == STATE_GRADIENT && self.gradMouseDown) {
                self.setStepTranslation(self.selected, event.clientX);
                self.updateBarGradient();
            }
        });
        this.setState(STATE_SINGLE);
    }

    getNextStepID() {
        return this.nextUniqueID++;
    }

    setEnabled(value) {
        this.enabled = value;
    }

    setState(state, count=0) {
        if(state == STATE_SINGLE) {
            this.setSelected(undefined);
            this.hideSteps(this.state == STATE_GRADIENT ? this.steps : this.fixedSteps);
            this.instruction.innerText = "Select Color:";
        } else if(state == STATE_GRADIENT) {
            let i=1;
            while(this.steps.length < 2) {
                let s = this.createStep(this.steps);
                this.setStepTranslation(s, CONTAINER_WIDTH/3 * i++);
            }
            this.setSelected(this.steps[0]);
            this.showSteps(this.steps);
            if(this.state == STATE_FIXED) this.hideSteps(this.fixedSteps);
            this.instruction.innerText = "Adjust Gradient:";
        } else {
            while(this.fixedSteps.length < count) {
                this.createStep(this.fixedSteps);
            }
            
            while(this.fixedSteps.length > count) {
                this.destroyStepAt(this.fixedSteps, this.fixedSteps.length - 1);
            }

            for(let i=0; i<this.fixedSteps.length; i++) {
                this.setStepTranslation(this.fixedSteps[i], CONTAINER_WIDTH/(count+1) * (i+1));
            }
            this.setSelected(this.fixedSteps[0])
            this.showSteps(this.fixedSteps);
            if(this.state == STATE_GRADIENT) this.hideSteps(this.steps);
            this.instruction.innerText = "Select Colors:";
        }
        this.state = state;
        this.updateBarGradient();
        
    }

    createStep(array) {
        var self = this;

        //Add step to DOM
        var element = document.createElement("div");
        element.className = "gradient-step";

        var s = new step(this.getNextStepID(), element, this.colorString, 0);

        element.addEventListener("mousedown", function(event) {
            if(self.selected) {
                self.setSelected(s);
                self.gradMouseDown = true;
                event.preventDefault();
            }
        });

        //Double click on step to remove
        element.addEventListener("dblclick", function(event) {
            if(self.selected && self.state == STATE_GRADIENT && array.length > 2) {
                for(let i=0; i<array.length; i++) {
                    if(array[i].id == s.id) {
                        //Remove step
                        self.destroyStepAt(array, i);

                        //Set selected to first
                        self.setSelected(array[Math.max(0, i-1)]);

                        //Recalculate gradient
                        self.updateBarGradient();
                        break;
                    }
                }
            }

            //Prevent bar underneath from creating step
            event.stopPropagation();
        });

        this.bar.appendChild(s.element);
        array.push(s);
        return s;
    }

    destroyStepAt(array, index) {
        let s = array[index];
        this.bar.removeChild(s.element);
        array.splice(index, 1);
    }

    showSteps(array) {
        array.forEach(s => s.element.style.visibility = "visible");
    }

    hideSteps(array) {
        array.forEach(s => s.element.style.visibility = "hidden");
    }

    setStepTranslation(s, left) {
        left -= this.barRectLeft;
        if(left >= 0 && left <= BAR_WIDTH - STEP_WIDTH) {
            s.element.style.left = left + "px";
            s.percentage = left/BAR_WIDTH;
        }
    }

    setSelected(s) {
        if(s) {
            if(this.selected) {
                this.selected.element.style.borderColor = "black";
            }
            this.picker.set("#" + s.color.getHexString());
            s.element.style.borderColor = "lightgrey";
        } else {
            this.picker.set("#" + this.colorString);
        }
        this.selected = s;
    }

    sortSteps(array) {
        array.sort(function(a, b){return a.percentage - b.percentage;});
    }

    getStepByID() {

    }

    updateBarGradient() {
        if(this.state == STATE_SINGLE) {
            //Set overall bar color since gradient requires more than one step
            this.bar.style.backgroundColor = "#" + this.colorString;
            this.bar.style.backgroundImage = "";
            this.eventSystem.invokeEvent("OnColorChange", this.colorString);
        } else {
            //Generate ordered gradient using hex and percentage steps
            var gradientCSS = "linear-gradient(to right";

            if(this.state == STATE_FIXED) {
                this.sortSteps(this.fixedSteps);
                this.eventSystem.invokeEvent("OnGradientChange", this.fixedSteps);

                //Create two css steps between each internal step
                var last = this.fixedSteps.length-1;
                for(var i=0; i<last; i++) {
                    var p = " " + 100 * (this.fixedSteps[i].percentage + this.fixedSteps[i+1].percentage)/2 + "%";
                    var c1 = ", #" + this.fixedSteps[i].color.getHexString();
                    var c2 = ", #" + this.fixedSteps[i+1].color.getHexString();
                    gradientCSS += c1 + p + c2 + p;
                }
                
            } else {
                this.sortSteps(this.steps);
                this.eventSystem.invokeEvent("OnGradientChange", this.steps);

                //Create css step at each step
                for(let i=0; i<this.steps.length; i++) {
                    gradientCSS += ", #" + this.steps[i].color.getHexString();
                    gradientCSS += " " + 100*this.steps[i].percentage + "%";
                }
            }

            gradientCSS += ")";
            this.bar.style.backgroundImage = gradientCSS;
        }
    }

    getColor() {
        return this.colorString;
    }
}

class step {
    constructor(id, element, color, percentage) {
        this.id = id;
        this.color = new THREE.Color("#" + color);
        this.element = element;
        this.percentage = percentage;
    }
}