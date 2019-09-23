class MenuLoad {
    constructor(element, loadingBar) {
        this.domElement = document.createElement("span");
        this.domElement.innerHTML = this.generateHTML();
        this.loadingBar = loadingBar;
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
            if(window.Worker){
                if(this.myWorker) {
                    this.myWorker.terminate();
                    this.myWorker = undefined;
                }

                this.myWorker = new Worker("inst/htmlwidgets/lib/TDAVIEW-CORE/worker.js");
                this.myWorker.postMessage({dataFile: event.target[0].files[0]});
                this.myWorker.onmessage = function(e){
                    //Update loading bar
                    self.loadingBar.style.width = 100 * e.data.progress + "%";
                    if(e.data.mapper) {
                        self.loadingBar.style.width = 0;

                        if(!event.target[1].files[0]) {
                            self.OnMapperFileChange(e.data.mapper, {});
                        } else {
                            var reader = new FileReader();
                            reader.onload = function(m) {
                                let dataCSV = m.target.result.trim();
                                let dataParsed = Papa.parse(dataCSV);
                                if(dataParsed.meta.aborted) {
                                    throw "Invalid CSV";
                                }
                                let metaArray = dataParsed.data;
                                for(let i=1; i<metaArray.length; ++i) {
                                    if(metaArray[i].length != metaArray[0].length) {
                                        throw "Invalid headers or column lengths";
                                    }
                                }
                                
                                //Get meta object
                                let rows = metaArray.length;
                                let cols = metaArray[0].length;
                                let metaObj = {};
                                for(let i=1; i<cols; ++i) {
                                    let colData = new Array(rows-1);
                                    for(let j=1; j<rows; ++j) {
                                        colData[j-1] = metaArray[j][i];
                                    }
                                    metaObj[metaArray[0][i-1]] = colData;
                                }
                                self.OnMapperFileChange(e.data.mapper, metaObj);
                            }
                            reader.readAsText(event.target[1].files[0]);
                        }
                    }
                };
                this.myWorker.onerror = function (e) {
                    console.error(e.message);
                };
                
            }
            else {
                console.error("your browser do not support WebWorkers");
            }
        });
    }

    OnMapperFileChange(distance, filtration, data, meta=undefined) {}

    OnSettingsFileChange(settingsObj) {}
}