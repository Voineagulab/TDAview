class LegendBar {
    constructor(element) {
        var self = this;

        this.domElement = document.createElement("div");
        this.domElement.innerHTML = this.generateHTML();
        element.appendChild(this.domElement);
        
        this.minLabel = document.getElementById("legendbarmin");
        this.maxLabel = document.getElementById("legendbarmax");
        this.bar = document.getElementById("legendbar");
        this.visible = true;
    }

    generateHTML() {
        return /*html*/`
        <div id="legendbar" draggable="true">
        <div id="legendbarmin" class="legendbarlabel unselectable">min</div>
        <div id ="legendbarmax" class="legendbarlabel unselectable">max</div>
        </div>
        `;
    }

    setLabels(min, max) {
        this.minLabel.textContent = min.toFixed(2);
        this.maxLabel.textContent = max.toFixed(2);
    }

    setLabelColor(colorString) {
        this.bar.style.color = "#" + colorString;
    }

    setGradientCSS(style) {
        this.bar.style.backgroundImage = style;
    }

    getGradientCSS() {
        return this.bar.style.backgroundImage;
    }

    setVisibility(visible) {
        this.domElement.style.display = visible ? "" : "none";
        this.visible = visible;
    }

    getVisibility() {
        return this.visible;
    }
}