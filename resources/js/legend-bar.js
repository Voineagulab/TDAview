class LegendBar {
    constructor(element) {
        var self = this;

        this.domElement = document.createElement("div");
        this.domElement.innerHTML = this.generateHTML();
        element.appendChild(this.domElement);

        this.minLabel = document.getElementById("legendbarmin");
        this.maxLabel = document.getElementById("legendbarmax");
        this.title = document.getElementById("legendbartitle");
        this.bar = document.getElementById("legendbar");
        this.visible = true;
    }

    generateHTML() {
        return /*html*/`
        <div id="legendbar" draggable="true">
            <div id="legendbartitle">Title</div><br>
            <div id="legendbarmin" class="legendbarlabel unselectable">min</div>
            <div id ="legendbarmax" class="legendbarlabel unselectable">max</div>
        </div>
        `;
    }

    fillContext(ctx) {
      if(!this.visible || this.steps.length == 0) return;

      //Draw bar (TODD: issue with magic constants, related to 250 sidebar)
      let rect = this.bar.getBoundingClientRect();
      let grad = ctx.linearGradient(rect.x - rect.width/2 - 175, rect.y, rect.x + rect.width/2 - 175, rect.y);
      if(this.steps[0].percentage > 0) grad.stop(0, '#' + this.steps[0].color.getHexString().toUpperCase());
      for(let i=0; i<this.steps.length; ++i) {
        grad.stop(this.steps[i].percentage, '#' + this.steps[i].color.getHexString().toUpperCase());
      }
      if(this.steps[0].percentage < 1) grad.stop(1, '#' + this.steps[this.steps.length-1].color.getHexString().toUpperCase());
      ctx.rect(rect.x - 250, rect.y, rect.width, rect.height);
      ctx.fill(grad);

      //Draw text
      ctx.fillColor(this.labelColor);

      let fontSizeCompute = parseFloat(window.getComputedStyle(this.title, null).getPropertyValue('font-size'));
      ctx.fontSize(fontSizeCompute);

      rect = this.title.getBoundingClientRect();
      ctx.text(this.title.textContent, rect.x -250, rect.y, {align: this.title.style.textAlign});

      rect = this.minLabel.getBoundingClientRect();
      ctx.text(this.minLabel.textContent, rect.x -250, rect.y, {align: this.minLabel.style.textAlign});

      rect = this.maxLabel.getBoundingClientRect();
      ctx.text(this.maxLabel.textContent, rect.x -250, rect.y, {align: this.maxLabel.style.textAlign});
    }

    setTitle(title) {
        this.title.textContent = title;
    }

    setLabels(min, max) {
        this.minLabel.textContent = min.toFixed(2);
        this.maxLabel.textContent = max.toFixed(2);
    }

    setLabelColor(colorString) {
        this.labelColor = "#" + colorString.toUpperCase();
        this.bar.style.color = this.labelColor;
    }

    setGradientCSS(style) {
        this.bar.style.backgroundImage = style;
    }

    setColors(steps) {
      this.steps = steps;
    }

    setVisibility(visible) {
        this.domElement.style.display = visible ? "" : "none";
        this.visible = visible;
    }

    getVisibility() {
        return this.visible;
    }
}
