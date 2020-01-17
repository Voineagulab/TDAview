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
                        <option value="PCA">PCA</option>
                    </select>
                    <br><br>
                    <font size="2">Override</font><br>
                    <input type="file" id="inputOverride" accept=".json">
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

        document.getElementById("inputSettings").onchange = function(event) {
            let reader = new FileReader();
            reader.onload = function(e) {
                let settingsObj = JSON.parse(e.target.result);
                self.OnSettingsFileChange(settingsObj);
            }
            reader.readAsText(this.files[0]);    
        }

        var filterdim = document.getElementById("filterdim");
        var distfunc = document.getElementById("distfunc");

        document.getElementById("mapperForm").addEventListener('submit', function(event) {
            event.preventDefault();

            let dataFile = event.target[0].files[0];
            let metaFile = event.target[1].files[0];
            let overrideFile = event.target[5].files[0];

            if(overrideFile) {
                //1. Load override mapper object directly
                //2. Load data file for headings column
                //3. Load metadata file using headings column

                let or = new FileReader();
                or.onload = function(ore) {
                    let mapperObject = JSON.parse(ore.target.result);

                    let dr = new FileReader();
                    dr.onload = function(dre) {
                        let dataParsed = Papa.parse(dre.target.result.trim());

                        if(dataParsed.meta.aborted)
                            throw "Invalid data CSV";

                        let dataArray = dataParsed.data;

                        for(let i=1; i<dataArray.length; ++i) 
                            if(dataArray[i].length != dataArray[0].length) 
                                throw "Invalid data headers or column lengths";

                        let headingsKey = {};
                        dataArray.shift(); 
                        for(let i=0; i<dataArray.length; ++i) {
                            headingsKey[dataArray[i][0]] = i;
                            dataArray[i].shift();
                        }

                        self._ReadMetaAsync(metaFile, headingsKey, function(metaObject) {
                            self.OnMapperFileChange(mapperObject, metaObject, Object.keys(headingsKey));
                            self._SetLoadingFinished();
                        });
                    }
                    dr.readAsText(dataFile);
                }
                or.readAsText(overrideFile);
            } else {
                //1. Load data using webworker, which also returns headings column
                //2. Load metadata file using headings column

                if(!window.Worker)  throw "Current brower does not support WebWorkers";

                if(self.myWorker) {
                    self.myWorker.terminate();
                    self.myWorker = undefined;
                }

                self.myWorker = new Worker("inst/htmlwidgets/lib/TDAVIEW-CORE/worker.js");
                self.myWorker.postMessage({dataFile: event.target[0].files[0], filterDim: filterdim.options[filterdim.selectedIndex].value, distFunc: distfunc.options[distfunc.selectedIndex].value});
                self.myWorker.onmessage = function(e){
                    if(e.data.warning) {
                        console.warn(e.data.warning);
                        window.alert(e.data.warning);
                    }

                    self._SetLoadingProgress(e.data.progress);

                    if(e.data.mapper) {
                        self.loadingBar.style.width = 0;

                        if(!event.target[1].files[0]) {
                            self.OnMapperFileChange(e.data.mapper, {}, Object.keys(e.data.headingsKey));
                            self._SetLoadingFinished();
                        } else {
                            self._ReadMetaAsync(event.target[1].files[0], e.data.headingsKey, function(metaObject) {
                                self.OnMapperFileChange(e.data.mapper, metaObject, Object.keys(e.data.headingsKey));
                                self._SetLoadingFinished();
                            });
                        }
                    }
                }

                self.myWorker.onerror = function (e) {
                    console.error(e.message);
                    window.alert(e.message);
                };
            }
        });
    }

    _SetLoadingProgress(value) {
        this.loadingBar.style.width = 100 * value + "%";
    }

    _SetLoadingFinished() {
        this.loadingBar.style.width = 0;
    }

    _ReadMetaAsync(file, headingsKey, callback) {
        var reader = new FileReader();
        reader.onload = function(m) {
            let dataCSV = m.target.result.trim();
            let dataParsed = Papa.parse(dataCSV);
            if(dataParsed.meta.aborted) {
                throw "Invalid metadata CSV";
            }
            let metaArray = dataParsed.data;
            for(let i=1; i<metaArray.length; ++i) {
                if(metaArray[i].length != metaArray[0].length) {
                    throw "Invalid metadata headers or column lengths";
                }
            }

            //Get meta object
            let metaObj = {};
            for(let i=1; i<metaArray[0].length; ++i) {
                //Match indices
                let matched = new Array(metaArray.length-1);
                for(let j=1; j<=matched.length; ++j) {
                    matched[headingsKey[metaArray[j][0]]] = metaArray[j][i];
                }
                metaObj[metaArray[0][i]] = matched;
            }
            callback(metaObj);
        }
        reader.readAsText(file);
    }

    OnMapperFileChange(mapperObject, metaObject, rownames) {}

    OnSettingsFileChange(settingsObj) {}
}