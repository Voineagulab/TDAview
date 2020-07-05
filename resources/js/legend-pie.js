class LegendPie {
    constructor(element) {
        var self = this;

        this.domElement = document.createElement("div");
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

    fillContext(ctx) {
      if(!this.visible || this.entries.length == 0) return;

      let fontSizeCompute = parseFloat(window.getComputedStyle(this.title, null).getPropertyValue('font-size'));
      let rect = this.title.getBoundingClientRect();
      
      ctx.fontSize(fontSizeCompute);
      ctx.fillColor(this.colorString);
      ctx.text(this.title.textContent, rect.x-250, rect.y, {lineBreak: false});

      for(let i=0; i<this.entries.length; ++i) {
          let rect = this.entries[i].getBoundingClientRect();
          ctx.rect(rect.x - 250, rect.y, rect.width, rect.height);
          ctx.fill(this.colorStrings[i]);

          rect = this.labels[i].getBoundingClientRect();
          ctx.fillColor(this.colorString);
          ctx.text(this.labels[i].textContent, rect.x-250, rect.y, {lineBreak: false});
      }
    }

    setTitle(title) {
        this.title.textContent = title;
    }

    createEntries(labels) {
        this.domElement.innerHTML = this.generateHTML(labels);
        this.entries = document.getElementsByClassName("legendpieentry");
        this.labels = document.getElementsByClassName("legendpielabel");
        this.title = document.getElementById("legendpietitle");
        this._updateLabelColor();
    }

    setColors(colorStrings) {
        this.colorStrings = colorStrings.map(c => "#" + c.toUpperCase());
        for(let i=0; i<this.entries.length; i++) {
            this.entries[i].style.backgroundColor = this.colorStrings[i];
        }
    }

    setLabelColor(colorString) {
        this.colorString = "#" + colorString.toUpperCase();
        if(this.getVisibility()) {
            this._updateLabelColor();
        }
    }

    _updateLabelColor() {
        this.title.style.color = this.colorString;
        for(let i=0; i<this.labels.length; i++) {
            this.labels[i].style.color = this.colorString;
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
