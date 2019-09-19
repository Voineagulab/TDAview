class MenuLoad {
    constructor(element) {
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
                    <font size="2">Data</font><br>
                    <input type="file" id="inputData" accept=".csv" required>
                    <br><br>
                    <font size="2">Metadata</font><br>
                    <input type="file" id="inputMeta" accept=".csv">
                    <br><br>
                    <font size="2">Distance Function</font><br>
                    <select>
                        <option value="euclidean">Correlation</option>
                        <option value="manhatten">Euclidean</option>
                    </select>
                    <br><br>
                    <font size="2">Filtration Function</font><br>
                    <select>
                        <option value="PCA">PCA</option>
                    </select>
                    <br><br>

                    <input type="submit" value="Generate Graph" class="myButton">
                </form>
            </fieldset>

            <fieldset>
            <legend>Settings</legend>
                <input type="file" id="inputSettings" accept=".json">
        </fieldset>
        `;
    }
    
    _init() {
        var self = this;

        const reader = new FileReader();
        document.getElementById("inputSettings").onchange = function(event) {
            reader.onload = function(e) {
                let settingsObj = JSON.parse(e.target.result);
                console.log(settingsObj);
                self.OnSettingsFileChange(settingsObj);
            }
            reader.readAsText(this.files[0]);

            
        }

        
        document.getElementById("mapperForm").addEventListener('submit', function(event) {
            event.preventDefault();

            //Function for importing CSV with constraints
            function loadCSVRectangle(inputElement, callback) {
                let file = inputElement.files[0];
                reader.onerror = function(){ 
                    inputElement.setCustomValidity("Invalid URI");
                };
                reader.onload = function(e) {
                    var csv = e.target.result.trim();
                    var result = Papa.parse(csv);
                    if(result.meta.aborted) {
                        inputElement.setCustomValidity("Invalid CSV");
                        callback(null);
                        return;
                    }
                    let data = result.data;
                    if(data[0].length == data[1].length) {
                        data[0].shift();
                    }

                    for(let i=1; i<data.length; ++i) {
                        if(data[i].length != data[0].length+1) {
                            inputElement.setCustomValidity("Invalid headers or column lengths"); //TODO fix this bug - it keeps showing after one bad file
                            callback(null);
                            return;
                        }
                    }
                    inputElement.setCustomValidity("");
                    callback(result.data);
                }
                reader.readAsText(file);
            }

            //Determine distance and filtration functions
            let distance = event.target[2].options[event.target[2].selectedIndex].value;
            let filtration = event.target[3].options[event.target[3].selectedIndex].value;

            //Load data
            var dataElement = event.target[0];
            loadCSVRectangle(dataElement, function(data) {
                if(!data) return;

                //Optionally load metadata
                var metaElement = event.target[1];
                if(metaElement.files.length) {
                    loadCSVRectangle(metaElement, function(meta) {
                        if(!meta) return;
                        self.OnMapperFileChange(distance, filtration, data, meta);
                    });
                } else {
                    self.OnMapperFileChange(distance, filtration, data);
                }
            });
        }, false);
    }

    OnMapperFileChange(distance, filtration, data, meta=undefined) {}

    OnSettingsFileChange(settingsObj) {}
}