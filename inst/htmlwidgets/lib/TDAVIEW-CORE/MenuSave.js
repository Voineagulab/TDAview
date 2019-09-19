class MenuSave {
    constructor(element) {
        this.domElement = document.createElement("span");
        this.domElement.innerHTML = this.generateHTML();
        element.appendChild(this.domElement);

        this._init();
    }

    generateHTML() {
        return /*html*/`
        <fieldset>
        <legend>Settings</legend>
            <input type="button" class="myButton" id="settingsexport" value="Export Settings">
        </fieldset>

        <fieldset>
        <legend>Publish</legend>
            <font size="2">Background</font><br>
            <div id="back-color-picker-insert"></div><br>

            <font size="2">Format</font><br>
            <select id="formatDropdown">
                    <option value="png">PNG</option>
                    <option value="jpg">JPG</option>
                    <option value="pdf" disabled>PDF</option>
            </select>
            <br><br>
            <input type="button" class="myButton" id="graphexport" value="Export Graph">
        </fieldset>
        `;
    }

    _init() {
        var self = this;
        this.backColorPicker = new ColorPicker(document.getElementById("back-color-picker-insert"));

        this.backColorPicker.OnColorChange = function(color) {
            self.OnBackgroundColorChange(color);
        };

        this.formatDropdown = document.getElementById("formatDropdown");
        document.getElementById("graphexport").onclick = function() {
            self.OnExportGraph(self.formatDropdown.options[self.formatDropdown.selectedIndex].value);
        };

        document.getElementById("settingsexport").onclick = function() {
            self.OnSettingsExport();
        }
    }

    getSettings() {
        return {
            backgroundColor: this.backColorPicker.getColor(),
            preferredFormat: self.formatDropdown.options[self.formatDropdown.selectedIndex].value
        }
    }

    setSettings(obj) {
        this.backColorPicker.setColor(obj.backgroundColor);
        this.OnBackgroundColorChange(obj.backgroundColor);
        this.formatDropdown.value = obj.preferredFormat;
    }

    /**
     * Invoked when the background should be colored using a newly selected uniform.
     * @param {String} color a six character hex color
     */
    OnBackgroundColorChange(color) {}

    /**
     * Invoked when the graph is to be exported.
     * @param {String} format either "jpg" or "png"
     */
    OnExportGraph(format) {}

    OnSettingsExport() {}
}