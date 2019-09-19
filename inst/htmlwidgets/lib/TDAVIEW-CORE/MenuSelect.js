class MenuSelect {
    constructor(element) {
        this.domElement = document.createElement("span");
        this.domElement.innerHTML = this.generateHTML();
        element.appendChild(this.domElement);

        this._init();
    }

    generateHTML() {
        return /*html*/`
        <fieldset>
            <legend id="selected-legend"></legend>
                <div id="selected-list">
                </div>
                <br>
                <input type="button" class="myButton"  id="selectexport" value="Export Data">
        </fieldset>
        `;
    }

    _init() {
        var self = this;
        this.accItem = this.accItem = this.domElement.getElementsByClassName("accordion-item");
        this.selectAccItem = document.getElementById("selected-item");
        this.selectAccItem.classList.add("disable_acc");
        this.selectLegend = document.getElementById("selected-legend");
        this.selectField = document.getElementById("selected-list");

        document.getElementById("selectexport").addEventListener("click", function() {
            self.OnExportData();
        });
    }

    Open(name, list) {
        this.selectLegend.innerHTML = name;
        
        let listHTML = "";
        for(let i=0; i<list.length && i<5; i++) {
            listHTML +=  list[i] + "<br>";
        }
        this.selectField.innerHTML = listHTML;

        this.selectAccItem.classList.remove("disable_acc");
        for(let item of this.accItem) {
            item.classList.remove("open_acc");
        }
        this.selectAccItem.classList.add("open_acc")
    }

    Close() {
        this.selectAccItem.classList.add("disable_acc");
        this.selectAccItem.classList.remove("open_acc")
    }

    /**
     * Invoked when the current selection is to be exported to csv.
     * @param {String} format either "jpg" or "png"
     */
    OnExportData() {}
}