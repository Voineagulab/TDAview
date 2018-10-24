class menu {
	constructor(graph, element, data, metaVars) {
        var self = this;
        this.data = data;

        var vars = data ? Object.keys(data) : [];

		this.domElement = document.createElement("div");
        this.domElement.innerHTML = this.generateHTML(vars, metaVars);
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

        /*----------Selected----------*/

        //Update table of values for selected node
        if(data) {
            graph.eventSystem.addEventListener("OnNodeSelect", function(node) {
                var table = document.getElementById("tbody");
                table.innerHTML = "";
                var header = document.createElement("tr");
                var headerFill = document.createElement("th");
                var headerMean = document.createElement("th");
                var headerSd = document.createElement("th");
                headerFill.textContent = "";
                headerMean.textContent = "Mean";
                headerSd.textContent = "SD";
                header.appendChild(headerFill);
                header.appendChild(headerMean);
                header.appendChild(headerSd);
                table.appendChild(header);
                
                vars.sort(function(a, b){return node.mean[b] - node.mean[a]});

                for(let i=0; i<Math.min(10, vars.length); i++) {
                    var newRow = document.createElement("tr");
                    var headerVar = document.createElement("th");
                    headerVar.textContent = vars[i];
                    var meanCell = document.createElement("td");
                    meanCell.textContent = node.mean[vars[i]].toFixed(2);
                    var sdCell = document.createElement("td");
                    sdCell.textContent = node.sd[vars[i]].toFixed(2);

                    newRow.appendChild(headerVar);
                    newRow.appendChild(meanCell);
                    newRow.appendChild(sdCell);
                    table.appendChild(newRow);
                }

                var accList = document.getElementsByClassName("accordion-item");
                for(let i=0; i<accList.length; i++) {
                    if (accList[i].classList.contains("open")) {
                        accList[i].classList.remove("open");
                        accList[i].classList.add("close");
                    }
                }
                table.parentNode.parentNode.parentNode.setAttribute("class", "accordion-item open");

                //Add data to enlarged table
                var bigTab = document.getElementById("bigTable");
                for(let i=0; i<bigTab.rows.length; i++) {
                    if(i >= 2) {
                        bigTab.deleteRow(i);
                    }
                }
                for(let i=0; i<node.points.length; i++) {
                    var newDataRow = document.createElement("tr");
                    for(let j=0; j<vars.length; j++) {
                        var newDataCell = document.createElement("td");
                        newDataCell.textContent = data[vars[j]][node.points[i]];
                        newDataRow.appendChild(newDataCell);
                    }
                    bigTab.appendChild(newDataRow);
                }
                //TODO ------
            });
        }

		//Close node data accordion when no node is selected
		graph.eventSystem.addEventListener("OnNodeDeselect", function() {
			var acc = document.getElementById("node-data").parentNode;
			acc.setAttribute("class", "accordion-item close");
            //TODO -- Close enlarged table - closes on selecting another node
		});

        //Expand table of node data
        document.getElementById("expand-table").addEventListener("click", function() {
            self.eventSystem.invokeEvent("OnTableExpansion");
        });

        /*----------Node Radius----------*/

        //Node size events
        var sizeradios = document.forms["node-size-meta"].elements["nodesize"];
        for(let i=0; i<sizeradios.length; i++) {
            sizeradios[i].onclick = function() {
                self.eventSystem.invokeEvent("OnNodeSizeChange", this.value);
            }
        }

        /*----------Node Colour----------*/

        //Node color events
        this.nodeGradPicker = new gradientPicker(document.getElementById("node-color-picker-insert"));
        var nodeColorMetaBoxes = document.getElementsByClassName("node-color-meta-boxes");
        for(let i=0; i<nodeColorMetaBoxes.length; i++) {
            nodeColorMetaBoxes[i].onclick = function() {//e.ctrlKey
                var checked = Array.from(nodeColorMetaBoxes).filter(b => b.checked).map(b => b.value);
                self.eventSystem.invokeEvent("OnNodeColorChange", checked);
            }
        }

        /*----------Node Label----------*/

        //Node label events
        var labelradios = document.forms["labels"].elements["labeltype"];
        var prevValue = "";
        for(let i=0; i<labelradios.length; i++) {
            labelradios[i].onclick = function() {
                if(prevValue != this.value) {
                    for(let j=0; j<graph.nodes.length; j++) {
                        if(prevValue == "none") {
                            graph.nodes[j].removeLabelClassName('hiddenlabel');
                        }
                        switch(this.value) {
                            case "size": graph.nodes[j].setLabelText(graph.nodes[j].points.length); break;
                            case "none" : graph.nodes[j].addLabelClassName('hiddenlabel'); break;
                            default : graph.nodes[j].setLabelText("Node " + j); break;
                        }
                    }
                }
                prevValue = this.value;
            };
        }

        /*----------Edge Width----------*/

        //Slider for edge width
        var edgeWidthSlider = document.getElementById("edge-width-slider");
        edgeWidthSlider.addEventListener("input", function() {
            self.eventSystem.invokeEvent("OnEdgeWidthChange", edgeWidthSlider.value/100);
        });

        //Reset edge width to default
        document.getElementById("reset-edge-width").onclick = function () {
            self.eventSystem.invokeEvent("ResetEdgeWidth");
        };

        /*----------Edge Colour----------*/

        //Edge color events
        this.edgeGradPicker = new gradientPicker(document.getElementById("edge-color-picker-insert")); //multiple gradient pickers causes error atm
        var edgeColorMetaRadios = document.getElementsByClassName("edge-color-meta-radio");
        for(let i=0; i<edgeColorMetaRadios.length; i++) {
            edgeColorMetaRadios[i].onclick = function() {
                self.eventSystem.invokeEvent("OnEdgeColorChange", this.value);
            }
        }

        //Edge color dropdown
        var edgeColor = document.getElementById("edge-color-dropdown");
        edgeColor.addEventListener("select", function() {
            self.eventSystem.invokeEvent("OnEdgeColorDropdown", edgeColor.options[edgeColor.selectedIndex].value);
        });

        /*----------Legend----------*/

        //Toggle draggable legends
        document.forms["legends"].elements["locked"].onclick = function() {
        	self.eventSystem.invokeEvent("ToggleDrag");
        };

        //Toggle visibility of legends
        var legends = document.getElementsByClassName("legend-display");
        for(let i=0; i<legends.length; i++) {
            legends[i].onclick = function () {
                self.eventSystem.invokeEvent("OnLegendToggle", legends[i]);
            }
        }

        //Node legend dropdown
        var nodeLegend = document.getElementById("node-legend-dropdown");
        nodeLegend.addEventListener("select", function() {
            self.eventSystem.invokeEvent("OnNodeLegendDropdown", nodeLegend.options[nodeLegend.selectedIndex].value);
        });

        //Edge legend dropdown
        var edgeLegend = document.getElementById("edge-legend-dropdown");
        edgeLegend.addEventListener("select", function() {
            self.eventSystem.invokeEvent("OnEdgeLegendDropdown", edgeLegend.options[edgeLegend.selectedIndex].value);
        });

        /*----------Export----------*/

        //Export events
        var graphradios = document.forms["graphext"].elements["graphtype"];
        document.getElementById("graphexport").addEventListener("click", function() {
            self.eventSystem.invokeEvent("OnExport", graphradios.value);
        });
    }

    generateHTML(vars, metaVars) { //use Parser.getVariableType(metaVars[i]), will return TYPE_DISCRETE or TYPE_CONTINUOUS
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
                                <th>SD</th>
                            </tr>
                            ${vars.map(v => `<tr><th>${v}</th><td>-</td><td>-</td></tr>`).join('')}
                        </tbody>
                        </table><br>
                        <a href="#" class="myButton" id="expand-table">Expand table</a>
                    </div>
                </div>
            </div>
            <div class="accordion-wrapper">
                <div class="accordion-item close">
                    <h4 class="accordion-item-heading">Node Radius</h4>
                    <div id="node-size" class="accordion-item-content">
                        <form name="node-size-meta">
                        <input type="radio" name="nodesize" value="content" id="contentsize" checked />
                        <label for="contentsize">Points</label><br>
                        ${metaVars.map(v => `<input type="radio" name="nodesize" value="${v}" id="${v}size"/><label for="${v}size">${v}</label><br>`).join('')}
                        <input type="radio" name="nodesize" value="none" id="nonesize"/>
                        <label for="nonesize">Uniform</label><br>
                        </form>
                    </div>
                </div>
                <div class="accordion-item close">
                    <h4 class="accordion-item-heading">Node Color</h4>
                    <div id="node-color" class="accordion-item-content">
                        ${metaVars.map(v => `<input type="checkbox" class="node-color-meta-boxes" value="${v}" id="${v}"/><label for="${v}">${v}</label><br>`).join('')}
                        <div id="node-color-picker-insert"></div>
                    </div>
                </div>
                <div class="accordion-item close">
                    <h4 class="accordion-item-heading">Node Label</h4>
                    <div id="labelselect" class="accordion-item-content">
                        <form name="labels">
                        <input type="radio" name="labeltype" value="name" id="name" checked />
                        <label for="name">Name</label><br>
                        <input type="radio" name="labeltype" value="size" id="size">
                        <label for="size">Size</label><br>
                        <input type="radio" name="labeltype" value="none" id="none">
                        <label for="none">None</label>
                        </form>
                    </div>
                </div>
            </div>
            <div class="accordion-wrapper">
                <div class="accordion-item close">
                    <h4 class="accordion-item-heading">Edge Width</h4>
                    <div class="accordion-item-content">
                        <form name="edge-slider">
                        <input type="range" min="1" max="100" value="50" class="slider" id="edge-width-slider"><br><br>
                        <a href="#" class="myButton" id="reset-edge-width">Reset</a>
                        </form>
                    </div>
                </div>

                <div class="accordion-item close">
                    <h4 class="accordion-item-heading">Edge Color</h4>
                    <div class="accordion-item-content">
                        <input type="radio" name="edgeColor" value="nodes" id="edgecolornode" class="edge-color-meta-radio" checked/>
                        <label for="edgecolornode">Use Node Colors</label><br>
                        ${metaVars.map(v => `<input type="radio" name="edgeColor" value="${v}" id="${v}edgecolor" class="edge-color-meta-radio"/><label for="${v}edgecolor">${v}</label><br>`).join('')}
                        <input type="radio" name="edgeColor" value="uniform" id="edgecolor" class="edge-color-meta-radio" />
                        <label for="edgecolor">Uniform</label><br>
                        <div id="edge-color-picker-insert"></div><br>
                        <select id="edge-color-dropdown">
                            <option name="edge-color-dropdown" value="interpolate">Interpolate</option>
                            <option name="edge-color-dropdown" value="average">Average</option>
                        </select>
                    </div>
                </div>
            </div>
            <div class="accordion-wrapper">
                <div class="accordion-item close">
                    <h4 class="accordion-item-heading">Legend</h4>
                    <div class="accordion-item-content">
                        <form name="legends">
                        <input type="checkbox" name="locked" value="locked" id="locked" />
                        <label for="locked">Lock positions</label><br><br>
                        <input type="checkbox" class="legend-display" name="legenddisplay" value="node-colour-legend" id="node-colour-legend" />
                        <label for="node-colour-legend">Toggle node colour</label><br>
                        <input type="checkbox" class="legend-display" name="legenddisplay" value="node-size-legend" id="node-size-legend" />
                        <label for="node-size-legend">Toggle node size</label><br><br>
                        Node --<br>
                        <select id="node-legend-dropdown">
                            <option value="none">None</option>
                            <option value="line">Line</option>
                            <option value="distribution">Distribution</option>
                        </select><br>
                        Edge --<br>
                        <select id="edge-legend-dropdown">
                            <option value="none">None</option>
                            <option value="line">Line</option>
                        </select><br><br>
                        <a href="#" class="myButton" id="reset">Reset to default</a>
                        </form>
                    </div>
                </div>
            </div>
            <div class="accordion-wrapper">
                <div class="accordion-item close">
                    <h4 class="accordion-item-heading">Export</h4>
                    <div class="accordion-item-content">
                        <form name="graphext">
                        <input type="radio" name="graphtype" value="png" id="png" checked />
                        <label for="png">PNG</label><br>
                        <input type="radio" name="graphtype" value="jpeg" id="jpeg">
                        <label for="jpeg">JPEG</label><br><br>
                        <a href="#" class="myButton" id="graphexport">Export Graph</a>
                        </form>
                    </div>
                </div>
            </div>

            

        </div>`;
    }
}
/* cool but unpolished
<div class="tooltip">
        <span class="tooltip-text">
            This was made by Kieran Walsh and Kamile Taouk.
        </span>
    </div>
*/