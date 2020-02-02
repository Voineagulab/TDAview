class Menu {
	constructor(element) {
        var self = this;

        this.domElement = document.createElement("span");
        this.domElement.innerHTML = this.generateHTML();
        element.appendChild(this.domElement);

        //Initiallize accordion animations
        var accHD = this.domElement.getElementsByClassName("accordion-item-heading");
        this.accItem = this.domElement.getElementsByClassName("accordion-item");

        let openAcc = function(index) {
            for(let j=0; j<self.accItem.length; j++) {
                if(index!=j) {
                    self.accItem[j].classList.remove("open_acc");
                }
            }
            self.accItem[index].classList.toggle("open_acc");
        }

        for(let i=0; i<this.accItem.length; i++) {
            accHD[i].addEventListener('click', function() { openAcc(i);}, false);
        }

        let loadingBar = document.getElementById("progress");
        let setLoadingProgress = function(value) {
            loadingBar.style.width = 100 * value + "%";
        }

        this.menuLoad = new MenuLoad(document.getElementById("menu-load"), setLoadingProgress);
        this.menuNodes = new MenuNodes(document.getElementById("menu-nodes"));
        this.menuEdges = new MenuEdge(document.getElementById("menu-edges"));
        this.menuSave = new MenuSave(document.getElementById("menu-save"));
        this.menuSelect = new MenuSelect(document.getElementById("menu-select"))

        this.sidezoom = document.getElementById("sidezoom");
        this.sidezoom.addEventListener("input", function() {
            self.OnZoom(self.sidezoom.value/100);
        });
    }

    generateHTML() {
        return /*html*/`
        <div id="progress"></div>
        <div class="unselectable sidenav">
            <h1 class="heading"></h1><br>
            <div class="accordion-wrapper">
                <div class="accordion-item">
                    <h4 class="accordion-item-heading">Generate Graph</h4>
                    <div class="accordion-item-content" id="menu-load">
                    </div>
                </div>
            </div>
            <div class="accordion-wrapper">
                <div class="accordion-item">
                    <h4 class="accordion-item-heading">Format Nodes</h4>
                    <div class="accordion-item-content" id="menu-nodes">
                    </div>
                </div>
                <div class="accordion-item">
                    <h4 class="accordion-item-heading">Format Edges</h4>
                    <div class="accordion-item-content" id="menu-edges">
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

    update(continuousNames, categoricalNames) {
        this.menuNodes.updateVariableNames(continuousNames, categoricalNames);
    }

    setSubmenusEnabled(value) {
        for(let i=1; i<this.accItem.length-1; ++i) {
            if(value) this.accItem[i].classList.remove("disable_acc");
            else this.accItem[i].classList.add("disable_acc");
        }
    }

    getSettings() {
        return {
            load: this.menuLoad.getSettings(),
            nodes: this.menuNodes.getSettings(),
            edges: this.menuEdges.getSettings(),
            save: this.menuSave.getSettings(),
            zoomSlider: this.sidezoom.value
        }
    }

    setSettings(obj) {
        this.menuLoad.setSettings(obj.load);
        this.menuNodes.setSettings(obj.nodes);
        this.menuEdges.setSettings(obj.edges);
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
