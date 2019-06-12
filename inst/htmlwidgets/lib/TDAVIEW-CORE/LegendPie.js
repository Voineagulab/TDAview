class LegendPie {
    constructor(element) {
        var self = this;

        this.domElement = document.createElement("div");
    }

    generateHTML(colors, labels) {
        return /*html*/`
        <div>

        </div>
        `;
    }

    setPie(colors, labels) {
        this.domElement.innerHTML = this.generateHTML(colors, labels);
    }

    setVisibility(visible) {
        this.domElement.style.display = visible ? "" : "none";
    }

    
}