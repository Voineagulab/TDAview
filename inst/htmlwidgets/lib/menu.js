/*
    btw, I don't think I can run this from my end
    TODO:
    1. Add event listeners for sidebar
    2. Checkboxes for metadata variables
    3. 

*/


class menu {
	constructor(graph, element, metaVars) {
		this.domElement = document.createElement("div");
        this.domElement.innerHTML = this.generateHTML(metaVars);
        this.eventSystem = new event(); //TODO unused

        element.appendChild(this.domElement);

        //Accordion listeners
        var accOpen = 0;
        var accItem = this.domElement.getElementsByClassName("accordion-item");
        var accHD = this.domElement.getElementsByClassName("accordion-item-heading");
        for(let i=0; i<accHD.length; i++) {
            accHD[i].addEventListener('click', function() {
                //Toggle accordion items
                if(accOpen != i) {
                    accItem[accOpen].className = 'accordion-item close';
                    accOpen = i;
                    accItem[accOpen].className = 'accordion-item open';
                }
            }, false);
        }

        //Node label customisation listeners
        var labelradios = document.forms["labels"].elements["labeltype"];
        for(let i=0; i<labelradios.length; i++) {
            labelradios[i].onclick = function() {
                if(this.value == "size") {
                    for(let i=0; i<graph.nodes.length; i++) {
                        graph.nodes[i].removeLabelClassName('hiddenlabel');
                        graph.nodes[i].addLabelClassName('unselectable');
                        graph.nodes[i].addLabelClassName('label');
                        graph.nodes[i].addLabelClassName('nlabel');
                        graph.nodes[i].setLabelText(graph.nodes[i].points.length);
                    }
                } else if (this.value == "none") {
                    for(let i=0; i<graph.nodes.length; i++) {
                        graph.nodes[i].addLabelClassName('hiddenlabel');
                        graph.nodes[i].removeLabelClassName('unselectable');
                        graph.nodes[i].removeLabelClassName('label');
                        graph.nodes[i].removeLabelClassName('nlabel');
                        graph.nodes[i].setLabelText("");
                    }
                } else {
                    for(let i=0; i<graph.nodes.length; i++) {
                        graph.nodes[i].removeLabelClassName('hiddenlabel');
                        graph.nodes[i].addLabelClassName('unselectable');
                        graph.nodes[i].addLabelClassName('label');
                        graph.nodes[i].addLabelClassName('nlabel');
                        graph.nodes[i].setLabelText("Node " + i);
                    }
                }
            };
        }

        //Graph exportation listeners
        var button = document.getElementById("graphexport");
        var graphradios = document.forms["graphext"].elements["graphtype"];
        button.addEventListener("click", function() {
            html2canvas(document.getElementById("export"), {
                width: width,
                height: height
            }).then(function(canvas) {
                    var imgtype = graphradios.value;
                    var imgdata = canvas.toDataURL("image/" + imgtype);
                    imgdata = imgdata.replace(/^data:image\/[^;]*/, 'data:application/octet-stream');
                    imgdata = imgdata.replace(/^data:application\/octet-stream/, 'data:application/octet-stream;headers=Content-Disposition%3A%20attachment%3B%20filename=Canvas.png');
                    button.setAttribute("download", "graph." + imgtype);
                    button.setAttribute("href", imgdata);
                }
            );
        });

        //Node color customisation 
        this.nodeGradPicker = new gradientPicker(document.getElementById("node-color"));
        this.nodeMetaPicker = document.getElementById("node-color-meta")
    }

    //TODO make metadata variables dynamically generated
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
                        Options for size functions go here..
                    </div>
                </div>

                <div class="accordion-item close">
                    <h4 class="accordion-item-heading">Colour</h4>
                    <div id="node-color" class="accordion-item-content">
                    <form name="node-color-meta">
                        ${metaVars.map(v => `<input type="checkbox" name="node-color-meta" value="${v}" id="${v}"/><label for="${v}">${v}</label><br>`).join('')}
                    </form>
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
                        Options for size functions go here..
                    </div>
                </div>

                <div class="accordion-item close">
                    <h4 class="accordion-item-heading">Colour</h4>
                    <div class="accordion-item-content">
                        Options for colour source go here..
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

// Code for the base format..
/*
<div class="unselectable sidenav" style="width: 250px; height: 500px; position: absolute; top: 0px;">
            <br>
            <div class="closebtn">✕</div>
            <div class="setting light">Select Color Source:</div>
            <select id="options" class="setting">
                <option value="x">x</option>
                <option value="y">y</option>
            </select>
            <br>
            <div class="setting light">Node label as:</div>
            <select class="setting">
                <option value="name">Name</option>
                <option value="size">Size</option>
                <option value="none">None</option>
            </select>
            <br>
            <a class="button setting light" value="Export Graph">Export Graph</a>
            <select id="selectorExport" class="setting">
                <option value="JPEG">JPEG</option>
                <option value="PNG">PNG</option>
            </select>
            <br>
        </div>`/*
            <div class="setting light">Selected Node:</div>
            <table id="table" style="display: none;">
            <thead>
                <tr>
                    ${options.map(o => `<th>${o}</th>`)}
                </tr>
            </thead>
            <tbody>
                ${("<tr>" + "<td></td>".repeat(tableCols) + "</tr>").repeat(tableRows)};
            </tbody>
            </table>
        </div>
        `* /
*/

