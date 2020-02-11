class MenuLoad {
    constructor(element, setLoadingStep, setLoadingProgress) {
        this.domElement = document.createElement("span");
        this.domElement.innerHTML = this.generateHTML();
        element.appendChild(this.domElement);

        //e.g. http://127.0.0.1:8887?data=/Examples/exp_bySamples.csv&meta=/Examples/meta_bySamples.csv
        let url = new URL(window.location.href);
        this.defaultData = url.searchParams.get("data");
        this.defaultMeta = url.searchParams.get("meta");
        this.defaultLoad = url.searchParams.get("load");
        this._init(setLoadingStep, setLoadingProgress);
    }

    generateHTML() {
        return /*html*/`
        <fieldset>
            <legend>Load Data</legend>
            <font size="2">Data</font><br>
            <input type="file" id="inputData" style="display:none;" accept=".csv">
            <label for="inputData" class="btn btninline">Browse...</label>
            <font size="1" id="inputDataText" class="btninline">No file chosen</font>
            <br><br>
            <input type="file" id="inputMeta" style="display:none;" accept=".csv">
            <label for="inputMeta" class="btn btninline">Browse...</label>
            <font size="1" id="inputMetaText" class="btninline">No file chosen</font>
        </fieldset>

        <br>

        <fieldset class=fieldsetTight>
            <legend>Mapper Object</legend>
        </fieldset>
        <button class="tablink" id="runtab">Run</button>
        <button class="tablink" id="loadtab">Load</button>

        <div id="runtabouter" class="tabcontent">
            <font size="2">Filter Dimensions</font><br>
            <select id="filterdim">
                <option value="1">Mapper1D</option>
                <option value="2">Mapper2D</option>
            </select>
            <br><br>
            <font size="2">Num Intervals</font><br>
            <input class="horizontalInput" id="numintervals" type="number" step="1" min="1" value="50"/>
            <br>

            <font size="2">Percent Overlap</font><br>
            <input class="horizontalInput" id="percentoverlap" type="number" min="1" value="50"/>
            <br>

            <font size="2">Num Bins</font><br>
            <input class="horizontalInput" id="numbins" type="number" step="1" min="1" value="10"/>

            <br><br>
            <font size="2">Distance Function</font><br>
            <select id="distfunc">
                <option value="euclidean">Euclidean</option>
                <option value="absolutepearson">Absolute Pearson</option>
            </select>
            <br><br>
            <font size="2">Filter Function</font><br>
            <select id="filterfunc">
                <option value="PCAEV1">PCA 1</option>
                <option value="PCAEV2">PCA 2</option>
                <option value="PCAEV1,2">PCA 1,2</option>
            </select>
            <br><br>
            <input type="submit" id="mapperSubmitRun" value="Generate" class="myButtonBottom">
            <br><br>

        </div>

        <div id="loadtabouter" class="tabcontent">
            <font size="2">Existing</font><br>
            <input type="file" id="inputOverride" accept=".json">
            <br><br>
            <input type="submit" id="mapperSubmitLoad" value="Generate" class="myButtonBottom">
            <br><br>
        </div>
        `;
    }

    _init(setLoadingStep, setLoadingProgress) {
        var self = this;

        var filterdim = document.getElementById("filterdim");
        var distfunc = document.getElementById("distfunc");

        var numintervals = document.getElementById("numintervals");
        var percentoverlap = document.getElementById("percentoverlap");
        var numbins = document.getElementById("numbins");

        const filterfuncpartitionindex = 2;
        var filterfunc = document.getElementById("filterfunc");

        self._UpdateAvailableFilterFunc(filterdim, filterfunc, filterfuncpartitionindex);
        filterdim.onchange = function() {
            self._UpdateAvailableFilterFunc(filterdim, filterfunc, filterfuncpartitionindex);
        };

        self._UpdateAvailableFilterFunc(filterdim, filterfunc, filterfuncpartitionindex);
        filterdim.onchange = function() {
            self._UpdateAvailableFilterFunc(filterdim, filterfunc, filterfuncpartitionindex);
        };

        function openPage(pageName, elmnt, color) {
            var i, tabcontent, tablinks;
            tabcontent = document.getElementsByClassName("tabcontent");
            for (i = 0; i < tabcontent.length; i++) {
              tabcontent[i].style.display = "none";
            }
            tablinks = document.getElementsByClassName("tablink");
            for (i = 0; i < tablinks.length; i++) {
              tablinks[i].style.backgroundColor = "";
            }
            document.getElementById(pageName).style.display = "block";
            elmnt.style.backgroundColor = color;
        }

        document.getElementById("runtab").onclick = function(){openPage("runtabouter", this, "#ececee");};
        document.getElementById("loadtab").onclick = function(){openPage("loadtabouter", this, "#ececee");};
        runtab.click();

        let inputData = document.getElementById("inputData");
        let inputDataText = document.getElementById("inputDataText");
        inputData.onchange = function() {
          inputDataText.textContent = inputData.files[0] ? inputData.files[0].name : "No file chosen";
        }

        if(this.defaultData) inputDataText.textContent = this.defaultData;

        let inputMeta = document.getElementById("inputMeta");
        let inputMetaText = document.getElementById("inputMetaText");
        inputMeta.onchange = function() {
          inputMetaText.textContent = inputMeta.files[0] ? inputMeta.files[0].name : "No file chosen";
        }

        if(this.defaultMeta) inputDataText.textContent = this.defaultMeta;

        document.getElementById("mapperSubmitRun").onclick = function() {
            self._tryGetFile(document.getElementById("inputData"), true, self.defaultData, function(dataFile) {
                if(!window.Worker)  throw "Current brower does not support WebWorkers";

                console.log(dataFile);

                if(self.myWorker) {
                    self.myWorker.terminate();
                    self.myWorker = undefined;
                }

                self.myWorker = new Worker("inst/htmlwidgets/lib/TDAVIEW-CORE/worker.js");
                self.myWorker.postMessage({
                  dataFile: dataFile,
                  filterDim: filterdim.options[filterdim.selectedIndex].value,
                  distFunc: distfunc.options[distfunc.selectedIndex].value,
                  filterFunc: filterfunc.options[filterfunc.selectedIndex].value,
                  numintervals: parseInt(numintervals.value),
                  percentoverlap: percentoverlap.value,
                  numbins: parseInt(numbins.value)
                });

                self.myWorker.onmessage = function(e){
                    if(e.data.warning !== undefined) {
                        console.warn(e.data.warning);
                        window.alert(e.data.warning);
                    }

                    if(e.data.progressstep !== undefined) {
                      setLoadingStep(e.data.progressstep.text, e.data.progressstep.currstep, e.data.progressstep.numstep);
                    }

                    if(e.data.progress !== undefined) {
                      setLoadingProgress(e.data.progress);
                    }

                    if(e.data.mapper !== undefined) {
                        self._getMetaAsync(e.data.headingsKey, function(metaObject) {
                            self.OnMapperFileChange(e.data.mapper, metaObject, Object.keys(e.data.headingsKey));
                            setLoadingStep("");
                            setLoadingProgress(0);
                        });
                    }
                }

                self.myWorker.onerror = function (e) {
                    console.error(e.message);
                    window.alert(e.message);
                };
            });
        }

        document.getElementById("mapperSubmitLoad").onclick = function() {
            self._tryGetFile(document.getElementById("inputData"), true, self.defaultData, function(dataFile) {
                self._tryGetFile(document.getElementById("inputOverride"), true, self.defaultLoad, function(overrideFile) {
                    //1. Load override mapper object directly
                    //2. Load data file for headings column
                    //3. Load metadata file using headings column

                    let or = new FileReader();
                    or.onload = function(ore) {
                        let mapperObject = JSON.parse(ore.target.result);
                        MatrixReader.ReadMatrixFromFile(dataFile, function(dataArray, headingsKey, conversionCount) {
                            self._getMetaAsync(headingsKey, function(metaObject) {
                                self.OnMapperFileChange(mapperObject, metaObject, Object.keys(headingsKey));
                            });
                        });
                    }
                    or.readAsText(overrideFile);
                });
            });



        }
    }

    _tryGetFile(element, required, fallbackURL, callback) {
        element.setCustomValidity("");
        if(element.files[0]) {
            callback(element.files[0]);
        } else if(fallbackURL) {
            fetch(fallbackURL).then(r => r.blob()).then(b => callback(new File([b], fallbackURL.replace(/^.*[\\\/]/, ''))));
        } else if(required){
            element.setCustomValidity("File required");
            element.reportValidity();
            throw "Data file required";
            callback(undefined);
        }
    }

    _UpdateAvailableFilterFunc(filterdim, filterfunc, filterfuncpartitionindex){
        if(filterdim.options[filterdim.selectedIndex].value == 1) {
            for(let i=0; i<filterfunc.options.length; ++i) {
                filterfunc.options[i].disabled = (i>=filterfuncpartitionindex);
                filterfunc.options[i].hidden = (i>=filterfuncpartitionindex);
            }
            filterfunc.selectedIndex = 0;
        } else {
            for(let i=0; i<filterfunc.options.length; ++i) {
                filterfunc.options[i].disabled = (i<filterfuncpartitionindex);
                filterfunc.options[i].hidden = (i<filterfuncpartitionindex);
            }
            filterfunc.selectedIndex = filterfuncpartitionindex;
        }
    }

    //Thing to match is first column of each row
    _getMetaAsync(headingsKey, callback) {
        this._tryGetFile(document.getElementById("inputMeta"), false, self.defaultMeta, function(metafile) {
            if(!metafile) {
                callback({});
                return;
            }

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
            reader.readAsText(metafile);
        });
    }

    //TODO
    getSettings() {
        return {};
    }

    setSettings(obj) {

    }

    OnMapperFileChange(mapperObject, metaObject, rownames) {}

    OnSettingsFileChange(settingsObj) {}
}
