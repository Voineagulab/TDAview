/**
 * Everything except node positions is UI-related 
 * To back up, for example, node size, we save "continuous" and "name-of-variable"
 * To restore, we'd then set continuous radio to be checked and trigger OnNodeSizeContinuous "name-of-variable"
 * It would be good to disable graph.update - perhaps don't initiallise it until some "graph.start" is called
 */

class Sidebar {
	constructor(element, continuousNames, categoricalNames, hasLabels) { //, settingsObject
        var self = this;

        this.hasLabels = hasLabels;
		this.domElement = document.createElement("div");
        this.domElement.innerHTML = this.generateHTML(continuousNames, categoricalNames, hasLabels);
        element.appendChild(this.domElement);

        var accHD = this.domElement.getElementsByClassName("accordion-item-heading");
        var accItem = this.domElement.getElementsByClassName("accordion-item");
        for(let i=0; i<accItem.length; i++) {
            accHD[i].addEventListener('click', function() {
                for(let j=0; j<accItem.length; j++) {
                    if(i!=j) {
                        accItem[j].classList.remove("open_acc");
                    }
                }
                accItem[i].classList.toggle("open_acc");
            }, false);
        }
        this.selectAccItem = document.getElementById("selected-item");
        this.selectAccItem.classList.add("disable_acc");
        this.selectLegend = document.getElementById("selected-legend");
        this.selectField = document.getElementById("selected-list");

        this.nodeGradPicker = new GradientPicker(document.getElementById("node-color-picker-insert"));
        this.nodeGradPicker.eventSystem.addEventListener("OnColorChange", function(color) {
            self.OnNodeColorChange(color);
        });

        this.nodeGradPicker.eventSystem.addEventListener("OnGradientChange", function(steps) {
            self.OnNodeGradientChange(steps);
        });

        var colordatainput = document.getElementById("variablecolorinput");
        var colordatainputold = undefined;
        document.getElementById("nodecoloruniform").onclick = function() {
            self.OnNodeColorUniform();
            self.nodeGradPicker.setState(STATE_SINGLE);
            self.nodeGradPicker.updateBarGradient();
            colordatainput.disabled = true;
            
        };

        document.getElementById("nodecolorvariable").onclick = function() {
            colordatainput.disabled = false;
            if(colordatainputold) {
                colordatainput.value = colordatainputold;
                colordatainput.onchange();
            }            
        };

        colordatainput.onchange = function() {
            if(continuousNames.indexOf(colordatainput.value) >= 0) {
                self.nodeGradPicker.setState(STATE_GRADIENT);
                self.OnNodeColorContinuous(colordatainput.value);
                colordatainput.placeholder = colordatainputold = colordatainput.value; 
            } else if(categoricalNames.indexOf(colordatainput.value) >= 0) {
                let count = self.OnNodeColorCategorical(colordatainput.value);
                self.nodeGradPicker.setState(STATE_FIXED, count);
                colordatainput.placeholder = colordatainputold = colordatainput.value; 
            }
            self.nodeGradPicker.updateBarGradient();
            colordatainput.value = "";
        };

        var sizedatainput = document.getElementById("continuoussizeinput");
        var sizedatainputold = undefined;
        document.getElementById("nonesize").onclick = function() {
            sizedatainput.disabled = true;
            self.OnNodeSizeUniform();
        };

        document.getElementById("contentsize").onclick = function() {
            sizedatainput.disabled = true;
            self.OnNodeSizePoints();
        };

        document.getElementById("continuoussize").onclick = function() {
            sizedatainput.disabled = false;
            if(sizedatainputold) {
                sizedatainput.value = sizedatainputold;
                sizedatainput.onchange();
            }
        };

        sizedatainput.onchange = function() {
            if(continuousNames.indexOf(sizedatainput.value) >= 0) {
                self.OnNodeSizeContinuous(sizedatainput.value)
                sizedatainput.placeholder = sizedatainputold = sizedatainput.value; 
            }
            sizedatainput.value = "";
        };

        var edgecolor = document.getElementById("edgecolor");
        edgecolor.onclick = function() {
            self.OnEdgeColorUniform();
        }

        document.getElementById("edgecolornode").onclick = function() {
            self.OnEdgeColorFromNodes();
        };

        new ColorPicker(document.getElementById("edge-color-picker-insert")).eventSystem.addEventListener("OnColorChange", function(color) {
            if(!edgecolor.checked) {
                edgecolor.checked = true;
                edgecolor.onclick();
            }
            self.OnEdgeColorChange(color);
        });

        var edgeAlphaSlider = document.getElementById("edge-alpha-slider");
        edgeAlphaSlider.addEventListener("input", function() {
            self.OnEdgeAlphaChange(edgeAlphaSlider.value/100);
        });

        var edgeWidthSlider = document.getElementById("edge-width-slider");
        edgeWidthSlider.addEventListener("input", function() {
            self.OnEdgeWidthChange(edgeWidthSlider.value/100);
        });

        this.labelTextName = document.getElementById("name")
        this.labelTextName.onclick = function() {
            self.OnLabelTextName();
        }

        document.getElementById("size").onclick = function() {
            self.OnLabelTextPoints();
        }

        document.getElementById("none").onclick = function() {
            self.OnLabelTextNone();
        }

        var labelColPicker = new ColorPicker(document.getElementById("label-color-picker-insert"))
        var labelcolor = document.getElementById("labelcolor");

        labelColPicker.eventSystem.addEventListener("OnColorChange", function(color) {
            if(!labelcolor.checked) {
                labelcolor.checked = true;
                labelcolor.onclick();
            }
            self.OnLabelColorChange(color);
        });

        labelcolor.onclick = function() {
            self.OnLabelColorUniform();
            self.OnLabelColorChange(labelColPicker.getColor());
        }

        document.getElementById("labelcolorbackground").onclick = function() {
            self.OnLabelColorFromBackground();
        }

        var labelSizeInput = document.getElementById("labelSize") ;
        labelSizeInput.onchange = function(){
            self.OnLabelSizeChange(labelSizeInput.value)
        }

        var backColorPicker = new ColorPicker(document.getElementById("back-color-picker-insert"), "ffffff");
        backColorPicker.eventSystem.addEventListener("OnColorChange", function(color) {
            self.OnBackgroundColorChange(color);
        })

        var graphradios = document.forms["graphext"].elements["graphtype"];
        document.getElementById("graphexport").addEventListener("click", function() {
            self.OnExportGraph(graphradios.value);
        });

        document.getElementById("selectexport").addEventListener("click", function() {
            self.OnExportData();
        });

        this.sidezoom = document.getElementById("sidezoom");
        this.sidezoom.addEventListener("input", function() {
            self.OnZoom(self.sidezoom.value/100);
        });
    }

    RestoreSettings() {
        if(this.hasLabels) {
            this.labelTextName.checked = true;
            this.labelTextName.onclick();
        }
    }

    SetSelectionName(name) {
        this.selectLegend.innerHTML = name;
    }

    SetSelectionList(list) {
        let listHTML = "";
        for(let i=0; i<list.length && i<10; i++) {
            listHTML +=  list[i] + "<br>";
        }
        this.selectField.innerHTML = listHTML;
    }

    OpenSelectionMenu() {
        this.selectAccItem.classList.remove("disable_acc");
        this.selectAccItem.classList.add("open_acc")
    }

    CloseSelectionMenu() {
        this.selectAccItem.classList.add("disable_acc");
        this.selectAccItem.classList.remove("open_acc")
    }

    /**
     * Invoked when all nodes are to be scaled by a single uniform.
     * The actual uniform is currently constant and cannot be changed
     */
    OnNodeSizeUniform() {}

    /**
     * Invoked when nodes are to be scaled by the number of data points they contain.
     */
    OnNodeSizePoints() {}

    /**
     * Invoked when nodes are to be scaled by the mean of a contained continuous variable.
     * @param {String} name the name of a continuous or categorical variable
     * @returns {Boolean} whether name was valid
     */
    OnNodeSizeContinuous(name) {return false}

    /**
     * Invoked when all nodes are to be colored by a single uniform.
     * The actual uniform will be supplied in the OnNodeColorChange event.
     */
    OnNodeColorUniform() {}

    /**
     * Invoked when nodes are to be colored by 
     * @param {String} name the name of a categorical variable
     * @returns {Number} the number of categories
     */
    OnNodeColorCategorical(name) {}

    /**
     * Invoked when nodes are to be colored by 
     * @param {String} name the name of a continuous variable
     */
    OnNodeColorContinuous(name) {}

    /**
     * Invoked when all nodes are to be colored by a newly selected uniform.
     * @param {String} color a six character hex color
     */
    OnNodeColorChange(color) {}

    /**
     * Invoked when nodes are to be colored by a newly edited gradient.
     * @param {Step[]} steps an array of steps
     */
    OnNodeGradientChange(steps) {}


    /**
     * Invoked when all edges are to be blended with the background by this amount.
     * @param {Number} alpha a value in the range [0.0, 1.0]
     */
    OnEdgeAlphaChange(alpha) {}

    /**
     * Invoked when all edges are to be multiplied by this value, 
     * where 1.0 stretches them to node radii.
     * @param {Number} width a value in the range [0.0, 1.0]
     */
    OnEdgeWidthChange(width) {}

    /**
     * Invoked when all edges are to be colored by a single uniform.
     * The actual uniform will be supplied in the OnEdgeColorChange event.
     */
    OnEdgeColorUniform() {}

    /**
     * Invoked when all edges are to be colored by the node map.
     */
    OnEdgeColorFromNodes() {}

    /**
     * Invoked when all edges are to be colored by a newly selected uniform.
     * @param {String} color a six character hex color
     */
    OnEdgeColorChange(color) {}

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

    /**
     * Invoked when the background should be colored using a newly selected uniform.
     * @param {String} color a six character hex color
     */
    OnBackgroundColorChange(color) {}

    /**
     * Invoked when the graph is to be exported.
     * @param {String} format either "jpg" or "png"
     */
    OnExportGraph(format) {}

    /**
     * Invoked when the current selection is to be exported to csv.
     * @param {String} format either "jpg" or "png"
     */
    OnExportData() {}

    /**
     * Invoked when the graph is to be zoomed.
     * @param {Number} zoom a value in the range [0.0, 1.0]
     */
    OnZoom(zoom) {}

    setZoomCustom(value) {
        this.sidezoom.value = value * 100;
    }

    generateHTML(continuousNames, categoricalNames, hasLabels) {
        let allNames = continuousNames.concat(categoricalNames);
        return /*html*/`
        <div class="unselectable sidenav">
            <h1 class="heading"></h1><br>
            <div class="accordion-wrapper">
                <div class="accordion-item">
                    <h4 class="accordion-item-heading">Nodes</h4>
                    <div id="node-size" class="accordion-item-content">
                        <fieldset>
                        <legend>Color</legend>
                            <input type="radio" name="nodecolor" value="uniform" id="nodecoloruniform" checked/>
                            <label for="nodecoloruniform">Uniform</label><br>
                            <input type="radio" name="nodecolor" value="variable" id="nodecolorvariable"/>
                            <label for="nodecolorvariable">Variable</label><br>
                            <input placeholder="Select:" list="variablecolordatalist" name="variablecolorinput" id="variablecolorinput" autocomplete="off" disabled>
                            <br>
                            <datalist id="variablecolordatalist">
                            ${allNames.map(v => `<option value="${v}">`).join('')}
                            </datalist>
                            <br>
                            <div id="node-color-picker-insert"></div>
                        </fieldset>
                        <fieldset>
                        <legend>Size</legend>
                            <input type="radio" name="nodesize" value="none" id="nonesize" checked/>
                            <label for="nonesize">Uniform</label><br>
                            <input type="radio" name="nodesize" value="content" id="contentsize" />
                            <label for="contentsize">Points</label><br>
                            <input type="radio" name="nodesize" value="continuous" id="continuoussize" />
                            <label for="continuoussize">Variable</label><br>
                            <input placeholder="Select:" list="continuoussizedatalist" name="continuoussizeinput" id="continuoussizeinput" autocomplete="off" disabled>
                            <datalist id="continuoussizedatalist">
                            ${continuousNames.map(v => `<option value="${v}">`).join('')}
                            </datalist>
                        </fieldset>
                    </div>
                </div>
                <div class="accordion-item">
                    <h4 class="accordion-item-heading">Edges</h4>
                    <div class="accordion-item-content">
                        <fieldset>
                        <legend>Color</legend>
                            <input type="radio" name="edgeColor" value="nodes" id="edgecolornode" class="edge-color-meta-radio" checked/>
                            <label for="edgecolornode">From Nodes</label><br>
                            <input type="radio" name="edgeColor" value="uniform" id="edgecolor" class="edge-color-meta-radio" />
                            <label for="edgecolor">Uniform</label><br><br>
                            <div id="edge-color-picker-insert"></div>
                        </fieldset>
                        <fieldset>
                        <legend>Style</legend>
                            Opacity
                            <br>
                            <input type="range" min="0" max="100" value="100" class="slider" id="edge-alpha-slider"><br>
                            Scale
                            <br>
                            <input type="range" min="0" max="100" value="10" class="slider" id="edge-width-slider"><br>
                        </fieldset>
                    </div>
                </div>
                <div class="accordion-item">
                    <h4 class="accordion-item-heading">Labels</h4>
                    <div class="accordion-item-content">
                        <fieldset>
                        <legend>Nodes</legend>
                            <form name="labels">
                            <input type="radio" name="labeltype" value="name" id="name" ${hasLabels ? "checked" : "disabled"} />
                            <label for="name">Given Name</label><br>
                            <input type="radio" name="labeltype" value="size" id="size">
                            <label for="size">Points</label><br>
                            <input type="radio" name="labeltype" value="none" id="none" ${!hasLabels ? "checked" : ""}>
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
                    </div>
                </div>
                
            </div>
            <div class="accordion-wrapper">
                <div class="accordion-item">
                    <h4 class="accordion-item-heading">Save</h4>
                    <div class="accordion-item-content">

                    <fieldset>
                    <legend>Background</legend>
                        <div id="back-color-picker-insert"></div>
                    </fieldset>

                    <fieldset>
                    <legend>Format</legend>
                        <form name="graphext">
                            <input type="radio" name="graphtype" value="png" id="png" checked />
                            <label for="png">PNG</label><br>
                            <input type="radio" name="graphtype" value="jpeg" id="jpeg">
                            <label for="jpeg">JPEG</label><br><br>
                            <a href="#" class="myButton" id="graphexport">Export Graph</a>
                        </form>
                    </fieldset>
                    </div>
                </div>
            </div>
            <div class="accordion-wrapper">
                <div class="accordion-item" id="selected-item">
                    <h4 class="accordion-item-heading" id="selected-item-heading">Selected</h4>
                    <div id="node-data" class="accordion-item-content">
                    <fieldset>
                    <legend id="selected-legend">Node 12</legend>
                        <div id="selected-list">
                        </div>
                        <br>
                        <a href="#" class="myButton" id="selectexport">Export Data</a>
                    </fieldset>
                    </div>
                </div>
            </div>
        </div>
        <input id="sidezoom" type="range" min="0" max="100" value="0" step="any" class="vranger"/>
        `;
    }
}