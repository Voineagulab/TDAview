class MenuLoadData {
    constructor(element, loadingBar) {
        this.domElement = document.createElement("span");
        this.domElement.innerHTML = this.generateHTML();
        element.appendChild(this.domElement);

        this._init();
    }

    generateHTML() {
        return /*html*/`
        <fieldset>
        <legend>Mapper</legend>
            <font size="2">Data</font><br>
            <input type="file" id="inputData" accept=".csv" required>
            <br><br>
            <font size="2">Metadata</font><br>
            <input type="file" id="inputMeta" accept=".csv">
            <br><br>
        </fieldset>
        `;
    }

    _init() {

    }
}
