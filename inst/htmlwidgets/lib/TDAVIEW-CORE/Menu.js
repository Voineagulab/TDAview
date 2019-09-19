/**
 * Everything except node positions is UI-related 
 * To back up, for example, node size, we save "continuous" and "name-of-variable"
 * To restore, we'd then set continuous radio to be checked and trigger OnNodeSizeContinuous "name-of-variable"
 * It would be good to disable graph.update - perhaps don't initiallise it until some "graph.start" is called
 */

class Menu {
	constructor(element) {
        this.domElement = document.createElement("span");
        this.domElement.innerHTML = this.generateHTML();
        element.appendChild(this.domElement);

        this.menuLoad = new MenuLoad(document.getElementById("menu-load"));
        this.menuNodes = new MenuNodes(document.getElementById("menu-nodes"));
        this.menuEdges = new MenuEdge(document.getElementById("menu-edges"));
        this.menuLabels = new MenuLabels(document.getElementById("menu-labels"));
        this.menuSave = new MenuSave(document.getElementById("menu-save"));
        this.menuSelect = new MenuSelect(document.getElementById("menu-select"))
        
        //Initiallize accordion animations
        var self = this;
        var accHD = this.domElement.getElementsByClassName("accordion-item-heading");
        this.accItem = this.domElement.getElementsByClassName("accordion-item");
        for(let i=0; i<this.accItem.length; i++) {
            accHD[i].addEventListener('click', function() {
                for(let j=0; j<self.accItem.length; j++) {
                    if(i!=j) {
                        self.accItem[j].classList.remove("open_acc");
                    }
                }
                self.accItem[i].classList.toggle("open_acc");
            }, false);
        }

        this.sidezoom = document.getElementById("sidezoom");
        this.sidezoom.addEventListener("input", function() {
            self.OnZoom(self.sidezoom.value/100);
        });
    }

    generateHTML() {
        return /*html*/`
        <div class="unselectable sidenav">
            <h1 class="heading"></h1><br>
            <div class="accordion-wrapper">
                <div class="accordion-item">
                    <h4 class="accordion-item-heading">Load</h4>
                    <div class="accordion-item-content" id="menu-load">
                    </div>
                </div>
            </div>
            <div class="accordion-wrapper">
                <div class="accordion-item">
                    <h4 class="accordion-item-heading">Nodes</h4>
                    <div class="accordion-item-content" id="menu-nodes">
                    </div>
                </div>
                <div class="accordion-item">
                    <h4 class="accordion-item-heading">Edges</h4>
                    <div class="accordion-item-content" id="menu-edges">
                    </div>
                </div>
                <div class="accordion-item">
                    <h4 class="accordion-item-heading">Labels</h4>
                    <div class="accordion-item-content" id="menu-labels">
                    </div>
                </div>
            </div>
            <div class="accordion-wrapper">
                <div class="accordion-item">
                    <h4 class="accordion-item-heading">Save</h4>
                    <div class="accordion-item-content" id="menu-save">
                    </div>
                </div>
            </div>
            <div class="accordion-wrapper">
                <div class="accordion-item" id="selected-item">
                    <h4 class="accordion-item-heading" id="selected-item-heading">Selected</h4>
                    <div class="accordion-item-content" id="menu-select">
                    </div>
                </div>
            </div>
        </div>
        <input id="sidezoom" type="range" min="0" max="100" value="0" step="any" class="vranger"/>
        `;
    }

    update(continuousNames, categoricalNames, hasLabels) {
        this.menuNodes.updateVariableNames(continuousNames, categoricalNames);
        this.menuLabels.updateNamesEnabled(hasLabels);
    }

    setSubmenusEnabled(value) {
        for(let i=1; i<this.accItem.length-1; ++i) {
            if(value) this.accItem[i].classList.remove("disable_acc");
            else this.accItem[i].classList.add("disable_acc");
        }
    }

    getSettings() {
        return {
            nodes: this.menuNodes.getSettings(),
            edges: this.menuEdges.getSettings(),
            labels: this.menuLabels.getSettings(),
            save: this.menuSave.getSettings(),
            zoomSlider: this.sidezoom.value
        }
    }

    setSettings(obj) {
        this.menuNodes.setSettings(obj.nodes);
        this.menuEdges.setSettings(obj.edges);
        this.menuLabels.setSettings(obj.labels);
        this.menuSave.setSettings(obj.save);
        this.sidezoom.value = obj.zoomSlider;
    }

    SetZoom(value) {
        this.sidezoom.value = value * 100;
    }

    /**
     * Invoked when the graph is to be zoomed.
     * @param {Number} zoom a value in the range [0.0, 1.0]
     */
    OnZoom(zoom) {}
}