class MenuRunMapper {
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
                <font size="2">Filter Dimensions</font><br>
                <select id="filterdim">
                    <option value="1">Mapper1D</option>
                    <option value="2">Mapper2D</option>
                </select>
                <br><br>
                <font size="2">Distance Function</font><br>
                <select id="distfunc">
                    <option value="euclidean">Euclidean</option>
                    <option value="absolutepearson">Absolute Pearson</option>
                </select>
                <br><br>
                <font size="2">Filter Function</font><br>
                <select id="filterfunc">
                    <option value="PCAEV1">PCA EV 1</option>
                    <option value="PCAEV2">PCA EV 2</option>
                    <option value="PCAEV1,2">PCA EV 1,2</option>
                </select>
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
