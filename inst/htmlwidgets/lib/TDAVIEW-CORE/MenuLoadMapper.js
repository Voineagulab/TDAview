class MenuLoadMapper {
    constructor(element, tryGetDataFile, getMetaAsync) {
        this.domElement = document.createElement("span");
        this.domElement.innerHTML = this.generateHTML();
        element.appendChild(this.domElement);

        this._init(tryGetDataFile, getMetaAsync);
    }

    generateHTML() {
        return /*html*/`
        <fieldset>
        <legend>Mapper</legend>
            <form id="mapperLoadForm">
                <font size="2">Override</font><br>
                <input type="file" id="inputOverride" accept=".json" required>
                <br><br>
                <input type="submit" value="Generate Graph" class="myButton">
            </form>
        </fieldset>
        `;
    }

    _init(tryGetDataFile, getMetaAsync) {
        var self = this;
        document.getElementById("mapperLoadForm").addEventListener('submit', function(event) {
            event.preventDefault();

            let dataFile = tryGetDataFile();
            let overrideFile = event.target[0].files[0];

            //1. Load override mapper object directly
            //2. Load data file for headings column
            //3. Load metadata file using headings column

            let or = new FileReader();
            or.onload = function(ore) {
                let mapperObject = JSON.parse(ore.target.result);
                MatrixReader.ReadMatrixFromFile(dataFile, function(dataArray, headingsKey, conversionCount) {
                    getMetaAsync(headingsKey, function(metaObject) {
                        self.OnMapperFileChange(mapperObject, metaObject, Object.keys(headingsKey));
                    });
                });
            }
            or.readAsText(overrideFile);
        });
    }

    OnMapperFileChange(mapperObject, metaObject, rownames) {}
}
