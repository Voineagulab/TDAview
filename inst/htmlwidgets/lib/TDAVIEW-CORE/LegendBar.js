class LegendBar {
    constructor(element) {
        var self = this;

        this.domElement = document.createElement("div");
        this.domElement.innerHTML = this.generateHTML();
    }

    generateHTML() {
        return /*html*/`
        <div>

        </div>
        `;
    }

    setLabels(min, max) {

    }

    setGradientCSS(style) {

    }

    getGradientCSS() {

    }

    setVisibility(visible) {
        this.domElement.style.display = visible ? "" : "none";
    }

    
}