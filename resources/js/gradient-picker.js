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

        this.silent = true;

        this.gradMouseDown = false;

        this.colorString = "ff0000";
        this.state = STATE_UNDEFINED;

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
        this.picker.enter();
        this.picker.on("change", function(color) {
            if(self.state != STATE_SINGLE) {
                self.selected.color.set("#" + color);
            } else {
                self.colorString = color;
            }
            if(!self.silent) {
                self.updateBarGradient();
            }
            self.silent = false;
        });

        this.fixedSteps = [];
        this.steps = [];

        this.bar.addEventListener("dblclick", function(event) {
            if(self.state == STATE_GRADIENT) {
                var s = self.createGradientStep();
                self.steps.push(s);
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

    getState() {
        return this.state;
    }

    setState(state, count=undefined) {
        if(state == STATE_SINGLE) {
            this.setSelected(undefined);
            this.hideSteps(this.state == STATE_GRADIENT ? this.steps : this.fixedSteps);
            this.instruction.innerText = "Select Color:";
        } else if(state == STATE_GRADIENT) {
            let i=1;
            while(this.steps.length < 2) {
                let s = this.createStep();
                this.steps.push(s);
                //this.setStepTranslation(s, CONTAINER_WIDTH/3 * i++);
                this.setStepTranslation(s, this.barRectLeft + (BAR_WIDTH-STEP_WIDTH) * i++);

            }
            this.setSelected(this.steps[0]);
            this.showSteps(this.steps);
            if(this.state == STATE_FIXED) this.hideSteps(this.fixedSteps);
            this.instruction.innerText = "Adjust Gradient:";
        } else {
            if(count === undefined) throw "step count not specified";
            while(this.fixedSteps.length < count) {
                let s = this.createStep();
                this.fixedSteps.push(s);
            }

            while(this.fixedSteps.length > count) {
                this.destroyStepAt(this.fixedSteps, this.fixedSteps.length - 1);
            }

            for(let i=0; i<this.fixedSteps.length; ++i) {
                //this.setStepTranslation(this.fixedSteps[i], CONTAINER_WIDTH * (i+1)/(count+1));
                this.setStepTranslation(this.fixedSteps[i], this.barRectLeft + (BAR_WIDTH-STEP_WIDTH) * (i+1)/(count+1));

            }

            this.setSelected(this.fixedSteps[0])
            this.showSteps(this.fixedSteps);
            if(this.state == STATE_GRADIENT) this.hideSteps(this.steps);
            this.instruction.innerText = "Select Colors:";
        }
        this.state = state;
    }

    createStep() {
        var self = this;
        var newStep = new StepElement(this.bar, 0,  new THREE.Color("#" + this.colorString));
        newStep.element.addEventListener("mousedown", function(event) {
            if(self.selected) {
                self.setSelected(newStep);
                self.gradMouseDown = true;
                event.preventDefault();
            }
        });
        return newStep;
    }

    createGradientStep() {
        var newStep = this.createStep();

        var self = this;

        //Double click on step to remove
        newStep.element.addEventListener("dblclick", function(event) {
            if(self.selected && self.steps.length > 2) {
                for(let i=0; i<self.steps.length; i++) {
                    if(self.steps[i].percentage == newStep.percentage && self.steps[i].color == newStep.color) {
                        //Remove step
                        self.destroyStepAt(self.steps, i);

                        //Set selected to first
                        self.setSelected(self.steps[Math.max(0, i-1)]);

                        //Recalculate gradient
                        self.updateBarGradient();
                        break;
                    }
                }
            }

            //Prevent bar underneath from creating step
            event.stopPropagation();
        });
        return newStep;
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
            s.percentage = left/(BAR_WIDTH-STEP_WIDTH);
        }
    }

    setStepPercentage(s, percentage) {
        this.setStepTranslation(s, percentage*(BAR_WIDTH-STEP_WIDTH) + this.barRectLeft);
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

    updateBarGradient() {
        if(this.state == STATE_SINGLE) {
            //Set overall bar color since gradient requires more than one step
            this.bar.style.backgroundColor = "#" + this.colorString;
            this.bar.style.backgroundImage = "";
            this.OnColorChange(this.colorString);
        } else {
            //Generate ordered gradient using hex and percentage steps
            var gradientCSS = "linear-gradient(to right";
            var steps = undefined;

            if(this.state == STATE_FIXED) {
                this.sortSteps(this.fixedSteps);

                //Create two css steps between each internal step
                var last = this.fixedSteps.length-1;
                for(var i=0; i<last; i++) {
                    var p = " " + 100 * (this.fixedSteps[i].percentage + this.fixedSteps[i+1].percentage)/2 + "%";
                    var c1 = ", #" + this.fixedSteps[i].color.getHexString();
                    var c2 = ", #" + this.fixedSteps[i+1].color.getHexString();
                    gradientCSS += c1 + p + c2 + p;
                }

                steps = this.fixedSteps;
            } else {
                this.sortSteps(this.steps);

                //Create css step at each step
                for(let i=0; i<this.steps.length; i++) {
                    gradientCSS += ", #" + this.steps[i].color.getHexString();
                    gradientCSS += " " + 100*this.steps[i].percentage + "%";
                }

                steps = this.steps;
            }

            gradientCSS += ")";
            this.bar.style.backgroundImage = gradientCSS;

            this.OnGradientChange(steps);
        }
    }

    getGradientCSS() {
        return this.bar.style.backgroundImage;
    }

    getSettings() {
        return {
            state: this.state,
            color: this.colorString,
            gradient: this.steps.map(s => {return {percentage: s.percentage, color: s.color.getHexString()};}),
            fixed: this.fixedSteps.map(s => {return {percentage: s.percentage, color: s.color.getHexString()};}),
        }
    }

    setSettings(obj) {
        while(this.steps.length) {
            this.destroyStepAt(this.steps, 0);
        }

        while(this.fixedSteps.length) {
            this.destroyStepAt(this.fixedSteps, 0);
        }

        this.colorString = obj.color;
        this.steps = obj.gradient.map(s => {var newS = this.createGradientStep(); newS.color.set('#' + s.color); this.setStepPercentage(newS, s.percentage); return newS;});
        this.fixedSteps = obj.fixed.map(s => {var newS = this.createStep(); newS.color.set('#' + s.color); this.setStepPercentage(newS, s.percentage); return newS;});

        this.hideSteps(this.steps);
        this.hideSteps(this.fixedSteps);
        this.state = STATE_SINGLE;
        this.setState(obj.state, obj.fixed.length);
    }

    OnColorChange(value) {};

    OnGradientChange(steps) {};
}
