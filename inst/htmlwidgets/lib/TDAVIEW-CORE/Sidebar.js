/**
 * Everything except node positions is UI-related 
 * To back up, for example, node size, we save "continuous" and "name-of-variable"
 * To restore, we'd then set continuous radio to be checked and trigger OnNodeSizeVariableChange "name-of-variable"
 * It would be good to disable graph.update - perhaps don't initiallise it until some "graph.start" is called
 */

class Sidebar {
	constructor(element, data, continuousNames, categoricalNames) {
        var self = this;

		this.domElement = document.createElement("div");
        this.domElement.innerHTML = this.generateHTML(data);
        element.appendChild(this.domElement);

        //Accordion events
        var accItem = this.domElement.getElementsByClassName("accordion-item");
        var accHD = this.domElement.getElementsByClassName("accordion-item-heading");
        for(let i=0; i<accHD.length; i++) {
            accHD[i].addEventListener('click', function() {
                for(let j=0; j<accItem.length; j++) {
                    if(i!=j) accItem[j].classList.remove("open_acc")
                }
                this.parentNode.classList.toggle("open_acc");
            }, false);
        }

        this.nodeGradPicker = new GradientPicker(document.getElementById("node-color-picker-insert"));
        this.nodeGradPicker.eventSystem.addEventListener("OnColorChange", function(color) {
            self.OnNodeColorChange(color);
        });

        this.nodeGradPicker.eventSystem.addEventListener("OnGradientChange", function(steps) {
            self.OnNodeGradientChange(steps);
        });

        var colordatainput = document.getElementById("variablecolorinput");
        document.getElementById("nodecoloruniform").onclick = function() {
            colordatainput.disabled = true;
            self.OnNodeColorUniform();
        }
        document.getElementById("nodecolorvariable").onclick = function() {
            colordatainput.disabled = false;
        }

        colordatainput.onchange = function() {
            if(data.getContinuousNames().indexOf(colordatainput.value) >= 0) {
                self.nodeGradPicker.setState(STATE_GRADIENT);
                self.OnNodeColorContinuous(colordatainput.value);
                colordatainput.placeholder = colordatainput.value; 
            } else if(data.getContinuousNames().indexOf(colordatainput.value) >= 0) {
                let count = self.OnNodeColorCategorical(colordatainput.value);
                self.nodeGradPicker.setState(STATE_FIXED, count);
                colordatainput.placeholder = colordatainput.value; 
            }
            colordatainput.value = "";
        }

        var sizedatainput = document.getElementById("continuoussizeinput");
        document.getElementById("nonesize").onclick = function() {
            sizedatainput.disabled = true;
            self.OnNodeSizeUniform();
        }
        document.getElementById("contentsize").onclick = function() {
            sizedatainput.disabled = true;
            self.OnNodeSizePoints();
        }
        document.getElementById("continuoussize").onclick = function() {
            sizedatainput.disabled = false;
        }
        sizedatainput.onchange = function() {
            if(self.OnNodeSizeVariable(sizedatainput.value)) {
                sizedatainput.placeholder = sizedatainput.value; 
            }
            sizedatainput.value = "";
        }





        /*

        //Node color events
        this.nodeGradPicker = new gradientPicker(document.getElementById("node-color-picker-insert"));
        var nodeColorMetaRadios = document.getElementsByName("nodecolor");
        var nodeColorDataInput = document.getElementById("variablecolorinput");
        nodeColorDataInput.onchange = ValidateColorVariableChange;

        for(let i=0; i<nodeColorMetaRadios.length; i++) {
            nodeColorMetaRadios[i].onclick() = function(){
                self.eventSystem.invokeEvent("OnNodeColorChange", this.value);
                if(this.value !== "variable") {
                    nodeColorDataInput.disabled = true;
                    //nodeColorDataInput.value = "";
                } else {
                    nodeColorDataInput.disabled = false;
                    ValidateColorVariableChange();
                }
            };
        }

        //Node label events TODO trigger events only here
        var labelradios = document.forms["labels"].elements["labeltype"];
        var prevValue = "";
        for(let i=0; i<labelradios.length; i++) {
            labelradios[i].onclick() = function() {
                if(prevValue !== this.value) {
                    for(let j=0; j<graph.nodes.length; j++) {
                        if(prevValue === "none") {
                            graph.nodes[j].removeLabelClassName('hiddenlabel');
                        }

                        let text = "";
                        switch(this.value) {
                            case "name" : text = graph.nodes[j].userData.getName(); break;
                            case "size": text = graph.nodes[j].userData.getPointCount(); break;
                            case "id" : text = j; break;
                        }

                        if(text === "") {
                            graph.nodes[j].addLabelClassName('hiddenlabel');
                        } else {
                            graph.nodes[j].setLabelText(text);
                        }
                    }
                }
                prevValue = this.value;
            };
        }

        //TODO abstract setting classnames and DOM efficiency into setLabelText(emptystring)
        let namesGiven = 0;
        for(let i=0; i<graph.nodes.length; i++) {
            let name = graph.nodes[i].userData.getName();
            if(name) {
                namesGiven++;;
            }
            graph.nodes[i].setLabelText(name);
        }

        if(namesGiven === 0) {
            labelradios[0].disabled = true;
            labelradios[3].checked = true;
        }

        var edgeAlphaSlider = document.getElementById("edge-alpha-slider");
        edgeAlphaSlider.addEventListener("input", function() {
            self.eventSystem.invokeEvent("OnEdgeAlphaChange", edgeAlphaSlider.value/100);
        })

        //Edge width change event
        var edgeWidthSlider = document.getElementById("edge-width-slider");
        edgeWidthSlider.addEventListener("input", function() {
            self.eventSystem.invokeEvent("OnEdgeWidthChange", edgeWidthSlider.value/100);
        });

        //Edge color events
        this.edgeGradPicker = new colorPicker(document.getElementById("edge-color-picker-insert")); //multiple gradient pickers causes error atm
        var edgeColorMetaRadios = document.getElementsByClassName("edge-color-meta-radio");
        for(let i=0; i<edgeColorMetaRadios.length; i++) {
            edgeColorMetaRadios[i].onclick() = function(){
                self.eventSystem.invokeEvent("OnEdgeColorChange", this.value);
            }
        }

        //Label color events
        this.labelGradPicker = new colorPicker(document.getElementById("label-color-picker-insert"));
        var labelColorMetaRadios = document.getElementsByClassName("label-color-meta-radio");
        for(let i=0; i<labelColorMetaRadios.length; i++) {
            labelColorMetaRadios[i].onclick() = function(){
                self.eventSystem.invokeEvent("OnLabelColorChange", this.value);
            }
        }

        //Label size events
        var labelSizeInput = document.getElementById("labelSize");
        labelSizeInput.onchange() {
            self.eventSystem.invokeEvent("OnLabelSizeChange", labelSizeInput.value);
        }

        this.backColorPicker = new colorPicker(document.getElementById("back-color-picker-insert"));

        
        
        
        */

        //Export events
        var graphradios = document.forms["graphext"].elements["graphtype"];
        document.getElementById("graphexport").addEventListener("click", function() {
            self.OnExport(graphradios.value);
        });

        //Zoom events
        this.sidezoom = document.getElementById("sidezoom");
        this.sidezoom.addEventListener("input", function() {
            self.OnZoom(self.sidezoom.value/100);
        });

        
        
    }

    OpenSelectionMenu() {
        var acc = document.getElementById("node-data").parentNode;
		acc.setAttribute("class", "accordion-item open_acc");
    }

    CloseSelectionMenu() {
        var acc = document.getElementById("node-data").parentNode;
		acc.setAttribute("class", "accordion-item");
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
     * Invoked when all labels are to be colored by a newly selected uniform.
     * @param {String} color a six character hex color
     */
    OnLabelColorChange(color) {}

    /**
     * Invoked when the graph is to be exported.
     * @param {String} format either "jpg" or "png"
     */
    OnExport(format) {}

    /**
     * Invoked when the graph is to be zoomed.
     * @param {Number} zoom a value in the range [0.0, 1.0]
     */
    OnZoom(zoom) {}

    setZoomCustom(value) {
        this.sidezoom.value = value * 100;
    }

    SetNodePickerCategoryCount(count) {
        this.nodeGradPicker.setState(STATE_FIXED, count);
    }

    generateHTML(data) {
        return /*html*/`
        <div class="unselectable sidenav">
            <br>
            <h1 class="heading"></h1><br>
            <div class="accordion-wrapper">
                <div class="accordion-item">
                    <h4 class="accordion-item-heading">Selected</h4>
                    <div id="node-data" class="accordion-item-content">
                        <input placeholder="Select:" list="variableselectdatalist" name="variableselectinput" id="variableselectinput" autocomplete="off">
                        <br>
                        <datalist id="variableselectdatalist">
                        ${data.getVariableNames().map(v => `<option value="${v}">`).join('')}
                        </datalist>
                        <table>
                        <tbody id="tbody">
                            <tr>
                                <th></th>
                                <th>Mean</th>
                                <th>Points</th>
                                <th>TTest</th>
                            </tr>
                        </tbody>
                        </table><br>
                        <!-- a href="#" class="myButton" id="expand-table">Expand table</a -->
                    </div>
                </div>
            </div>
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
                            ${data.getVariableNames().map(v => `<option value="${v}">`).join('')}
                            </datalist>
                            <br>
                            <div id="node-color-picker-insert"></div>
                        </fieldset>
                        <fieldset>
                        <legend>Size</legend>
                            <input type="radio" name="nodesize" value="none" id="nonesize" checked/>
                            <label for="nonesize">Uniform<br>
                            <input type="radio" name="nodesize" value="content" id="contentsize" /></label>
                            <label for="contentsize">Points</label><br>
                            <input type="radio" name="nodesize" value="continuous" id="continuoussize" />
                            <label for="continuoussize">Variable</label><br>
                            <input placeholder="Select:" list="continuoussizedatalist" name="continuoussizeinput" id="continuoussizeinput" autocomplete="off" disabled>
                            <datalist id="continuoussizedatalist">
                            ${data.getContinuousNames().map(v => `<option value="${v}">`).join('')}
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
                            <input type="radio" name="labeltype" value="name" id="name" checked />
                            <label for="name">Given Name</label><br>
                            <input type="radio" name="labeltype" value="id" id="id" />
                            <label for="id">ID</label><br>
                            <input type="radio" name="labeltype" value="size" id="size">
                            <label for="size">Points</label><br>
                            <input type="radio" name="labeltype" value="none" id="none">
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
                            <a href="#" class="myButton" id="graphexport">Export</a>
                        </form>
                    </fieldset>
                    </div>
                </div>
            </div>
        </div>
        <input id="sidezoom" type="range" min="0" max="100" value="0" step="any" class="vranger"/>
        `;
    }
}