class menu {
	constructor(graph, element, data) {
        var self = this;

		this.domElement = document.createElement("div");
        this.domElement.innerHTML = this.generateHTML(data);
        this.eventSystem = new event();
        element.appendChild(this.domElement);

        //Accordion events
        var accItem = this.domElement.getElementsByClassName("accordion-item");
        var accHD = this.domElement.getElementsByClassName("accordion-item-heading");
        for(let i=0; i<accHD.length; i++) {
            accHD[i].addEventListener('click', function() {
                for(let i=0; i<accItem.length; i++) {
                    if (accItem[i].classList.contains("open") && accItem[i] != this.parentNode) {
                        accItem[i].classList.remove("open");
                        accItem[i].classList.add("close");
                    }
                }

                if(this.parentNode.classList.contains("open")) {
                    this.parentNode.classList.remove("open");
                    this.parentNode.classList.add("close");
                } else {
                    this.parentNode.classList.remove("close");
                    this.parentNode.classList.add("open");
                }
                
            }, false);
        }

		//Close node data accordion when no node is selected
		graph.eventSystem.addEventListener("OnNodeDeselect", function() {
			var acc = document.getElementById("node-data").parentNode;
			acc.setAttribute("class", "accordion-item close");
            //TODO -- Close enlarged table - closes on selecting another node
        });
        
        function ValidateSizeVariableChange() {
            //Enforce values are on list and trigger event
            sizedatainput.value;
            if(data.getContinuousNames().indexOf(sizedatainput.value) < 0) {
                sizedatainput.value = "";
            } else {
                self.eventSystem.invokeEvent("OnNodeSizeVariableChange", sizedatainput.value);
            }
        }

        //Node size events
        var sizeradios = document.getElementsByName("nodesize");
        var sizedatainput = document.getElementById("continuoussizeinput");
        sizedatainput.onchange = ValidateSizeVariableChange;
        
        for(let i=0; i<sizeradios.length; i++) {
            sizeradios[i].onclick = function() {
                self.eventSystem.invokeEvent("OnNodeSizeChange", this.value);
                if(this.value !== "continuous") {
                    sizedatainput.disabled = true;
                    //sizedatainput.value = "";
                } else {
                    sizedatainput.disabled = false;
                    ValidateSizeVariableChange();
                }
            }
        }

        function ValidateColorVariableChange() {
            //Enforce values are on list and trigger event
            nodeColorDataInput.value;
            if(data.getVariableNames().indexOf(nodeColorDataInput.value) < 0) {
                nodeColorDataInput.value = "";
            } else {
                self.eventSystem.invokeEvent("OnNodeColorVariableChange", nodeColorDataInput.value);
            }
        }

        //Node color events
        this.nodeGradPicker = new gradientPicker(document.getElementById("node-color-picker-insert"));
        var nodeColorMetaRadios = document.getElementsByName("nodecolor");
        var nodeColorDataInput = document.getElementById("variablecolorinput");
        nodeColorDataInput.onchange = ValidateColorVariableChange;

        for(let i=0; i<nodeColorMetaRadios.length; i++) {
            nodeColorMetaRadios[i].onclick = function() {
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
            labelradios[i].onclick = function() {
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
        console.log(namesGiven);

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
            edgeColorMetaRadios[i].onclick = function() {
                self.eventSystem.invokeEvent("OnEdgeColorChange", this.value);
            }
        }

        //Label color events
        this.labelGradPicker = new colorPicker(document.getElementById("label-color-picker-insert"));
        var edgeColorMetaRadios = document.getElementsByClassName("label-color-meta-radio");
        for(let i=0; i<edgeColorMetaRadios.length; i++) {
            edgeColorMetaRadios[i].onclick = function() {
                self.eventSystem.invokeEvent("OnLabelColorChange", this.value);
            }
        }

        //Export events
        var graphradios = document.forms["graphext"].elements["graphtype"];
        document.getElementById("graphexport").addEventListener("click", function() {
            self.eventSystem.invokeEvent("OnExport", graphradios.value);
        });

        //Zoom events
        this.sidezoom = document.getElementById("sidezoom");
        this.sidezoom.addEventListener("input", function() {
            self.eventSystem.invokeEvent("OnZoomChange", self.sidezoom.value/100);
        });

        this.backColorPicker = new colorPicker(document.getElementById("back-color-picker-insert"));
    }

    setZoomCustom(value) {
        this.sidezoom.value = value * 100;
    }

    generateHTML(data) {
        return /*html*/`
        <div class="unselectable sidenav">
            <br>
            <h1 class="heading"></h1><br>
            <div class="accordion-wrapper">
                <div class="accordion-item close">
                    <h4 class="accordion-item-heading">Selected</h4>
                    <div id="node-data" class="accordion-item-content">
                        <table>
                        <tbody id="tbody">
                            <tr>
                                <th></th>
                                <th>Mean</th>
                                <th>Points</th>
                            </tr>
                            ${data.getVariableNames().map(v => `<tr><th>${v}</th><td>-</td><td>-</td></tr>`).join('')}
                        </tbody>
                        </table><br>
                        <!-- a href="#" class="myButton" id="expand-table">Expand table</a -->
                    </div>
                </div>
            </div>
            <div class="accordion-wrapper">
                <div class="accordion-item close">
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
                <div class="accordion-item close">
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
                <div class="accordion-item close">
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
                    </div>
                </div>
                
            </div>
            <div class="accordion-wrapper">
                <div class="accordion-item close">
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