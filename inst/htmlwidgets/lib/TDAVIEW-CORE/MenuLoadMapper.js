class MenuLoadMapper {
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
            <form id="mapperForm">
                <font size="2">Override</font><br>
                <input type="file" id="inputOverride" accept=".json">
                <br><br>
                <input type="submit" value="Generate Graph" class="myButton">
            </form>
        </fieldset>
        `;
    }

    _init() {

    }

    OnMapperFileChange(mapperObject, metaObject, rownames) {}

    OnSettingsFileChange(settingsObj) {}
}
