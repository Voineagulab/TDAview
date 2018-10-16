class menu {
	constructor(graph, element, metaVars) {
        var self = this;

		this.domElement = document.createElement("div");
        this.domElement.innerHTML = this.generateHTML(metaVars);
        this.eventSystem = new event(); //TODO unused

        element.appendChild(this.domElement);

        //Accordion events
        var accOpen = 0;
        var accItem = this.domElement.getElementsByClassName("accordion-item");
        var accHD = this.domElement.getElementsByClassName("accordion-item-heading");
        for(let i=0; i<accHD.length; i++) {
            accHD[i].addEventListener('click', function() {
                if(accOpen != i) {
                    accItem[accOpen].className = 'accordion-item close';
                    accOpen = i;
                    accItem[accOpen].className = 'accordion-item open';
                }
            }, false);
        }

        //Node size events
        var sizeradios = document.forms["node-size-meta"].elements["nodesize"];
        for(let i=0; i<sizeradios.length; i++) {
            sizeradios[i].onclick = function() {
                self.eventSystem.invokeEvent("onNodeSizeChange", this.value);
            }
        }

        //Node color events
        this.nodeGradPicker = new gradientPicker(document.getElementById("node-color-picker-insert"));
        var nodeColorMetaBoxes = document.getElementsByClassName("node-color-meta-boxes");
        for(let i=0; i<nodeColorMetaBoxes.length; i++) {
            nodeColorMetaBoxes[i].onclick = function() {//e.ctrlKey
                console.log(nodeColorMetaBoxes);
                var checked = Array.from(nodeColorMetaBoxes).filter(b => b.checked).map(b => b.value);
                self.eventSystem.invokeEvent("onColorMetaChange", checked);
            }
        }

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

        //Edge color events
        this.edgeGradPicker = new gradientPicker(document.getElementById("edge-color-picker-insert")); //multiple gradient pickers causes error atm

        //Export events
        var graphradios = document.forms["graphext"].elements["graphtype"];
        document.getElementById("graphexport").addEventListener("click", function() {
            self.eventSystem.invokeEvent("OnExport", graphradios.value);
        });
    }

    generateHTML(metaVars) {
        return /*html*/`
        <div class="unselectable sidenav">
            <br>

            <h1 class="subsection-heading">Node Settings</h1>
            <hr>
            <div class="accordion-wrapper">
                <div class="accordion-item open">
                    <h4 class="accordion-item-heading">Size</h4>
                    <div id="node-size" class="accordion-item-content">
                        <form name="node-size-meta">
                        <input type="radio" name="nodesize" value="content" id="contentsize" checked />
                        <label for="contentsize">Content</label><br>
                        ${metaVars.map(v => `<input type="radio" name="nodesize" value="${v}" id="${v}size"/><label for="${v}size">${v}</label><br>`).join('')}
                        <input type="radio" name="nodesize" value="none" id="nonesize"/>
                        <label for="nonesize">None</label><br>
                        </form>
                    </div>
                </div>
                <div class="accordion-item close">
                    <h4 class="accordion-item-heading">Color</h4>
                    <div id="node-color" class="accordion-item-content">
                        ${metaVars.map(v => `<input type="checkbox" class="node-color-meta-boxes" value="${v}" id="${v}"/><label for="${v}">${v}</label><br>`).join('')}
                        <div id="node-color-picker-insert"></div>
                        <select>
                            <option value="none">None</option>
                            <option value="line">Line</option>
                            <option value="distribution">Distribution</option>
                        </select>
                    </div>
                </div>

                <div class="accordion-item close">
                    <h4 class="accordion-item-heading">Label</h4>
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
            <hr>
            <h1 class="subsection-heading">Edge Settings</h1>
            <hr>
            <div class="accordion-wrapper">
                <div class="accordion-item close">
                    <h4 class="accordion-item-heading">Size</h4>
                    <div class="accordion-item-content">
                        <input type="range" min="1" max="100" value="50" class="slider" id="myRange">
                    </div>
                </div>

                <div class="accordion-item close">
                    <h4 class="accordion-item-heading">Color</h4>
                    <div class="accordion-item-content">
                        <input type="radio" name="edgeColor" value="nodes" id="edgecolornode" checked/>
                        <label for="edgecolornode">Use Node Colors</label><br>
                        ${metaVars.map(v => `<input type="radio" name="edgeColor" value="${v}" id="${v}edgecolor"/><label for="${v}edgecolor">${v}</label><br>`).join('')}
                        <input type="radio" name="edgeColor" value="nodes" id="edgecolor"/>
                        <label for="edgecolor">None</label><br>
                        <div id="edge-color-picker-insert"></div>
                        <select>
                            <option value="none">None</option>
                            <option value="line">Line</option>
                        </select>
                    </div>
                </div>
            </div>
            <hr>
            <h1 class="subsection-heading">Graph Settings</h1>
            <hr>
            <div class="accordion-wrapper">
                <div class="accordion-item close">
                    <h4 class="accordion-item-heading">Export graph</h4>
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