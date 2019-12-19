class LegendPie {
    constructor(element) {
        var self = this;

        this.domElement = document.createElement("div");
        this.title = document.getElementById("legendpietitle");
        element.appendChild(this.domElement);
        this.colorString = "ffffff";
    }

    generateHTML(labels) { //${labels.map(l => `<div>${l}</div>`)}
        return /*html*/`
        <div id="legendpie">
            <div id="legendpietitle">Title</div>
            <table cellpadding="0" cellspacing="2" border="0">
            ${labels.map(label => `
                <tr>
                    <td><div class="legendpieentry"></div></td>
                    <td><div class="legendpielabel">${label}</div></td>
                </tr>
            `).join('')}
            </table>
        </div>
        `;
    }

    setTitle(title) {
        this.title.textContent = title;
    }

    createEntries(labels) {
        this.domElement.innerHTML = this.generateHTML(labels);
        this.entries = document.getElementsByClassName("legendpieentry");
        this.labels = document.getElementsByClassName("legendpielabel");
        this._updateLabelColor();
    }

    setColors(colorStrings) {
        for(let i=0; i<this.entries.length; i++) {
            this.entries[i].style.backgroundColor = "#" + colorStrings[i];
        }
    }

    setLabelColor(colorString) {
        this.colorString = colorString
        if(this.getVisibility()) {
            this._updateLabelColor();
        }
    }

    _updateLabelColor() {
        for(let i=0; i<this.labels.length; i++) {
            this.labels[i].style.color = "#" + this.colorString;
        }
    }

    setVisibility(visible) {
        this.domElement.style.display = visible ? "" : "none";
        this.visible = visible;
    }

    getVisibility() {
        return this.visible;
    }
}