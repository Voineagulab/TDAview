class MenuLoad {
    constructor(element, setLoadingStep, setLoadingProgress) {
        this.domElement = document.createElement("span");
        this.domElement.innerHTML = this.generateHTML();
        element.appendChild(this.domElement);

        this.filterCompatibility = [1, 1, 2, 0];

        this._init(setLoadingStep, setLoadingProgress);
    }

    generateHTML() {
        return /*html*/`
        <fieldset>
            <legend>Load Data</legend>
            <font size="2">Data</font>

            <input type="file" id="inputData" style="opacity:0;" accept=".csv">
            <button class="btninline" id="inputDataLabel">Choose File</button>
            <font size="1" id="inputDataText" class="btninline">No file chosen</font>


            <input type="file" id="inputMeta" style="opacity:0;" accept=".csv">
            <button class="btninline" id="inputMetaLabel">Choose File</button>
            <font size="1" id="inputMetaText" class="btninline">No file chosen</font>

            <br><br>

            <font size="2">Example Data</font><br>
            <select id="examples">
              <option value="None">None</option>
            </select>
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
                <option value="CMDS">Classical MDS</option>
            </select>
            <br><br>
            <input type="submit" id="mapperSubmitRun" value="Generate" class="myButtonBottom">
            <br><br>

        </div>

        <div id="loadtabouter" class="tabcontent">
            <font size="2">Existing</font><br>
            <input type="file" id="inputOverride" style="opacity:0;" accept=".json">
            <button class="btninline" id="inputOverrideLabel">Choose File</button>
            <font size="1" id="inputOverrideText" class="btninline">No file chosen</font>
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

        const filterfuncpartitionindex = 3;
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

        let inputDataLabel = document.getElementById("inputDataLabel");
        let inputMetaLabel = document.getElementById("inputMetaLabel");
        let inputOverrideLabel = document.getElementById("inputOverrideLabel");

        this.examples = document.getElementById("examples");
        let exampleObj = {};

        function updateExamples(newObj) {
          exampleObj = newObj;
          while(self.examples.childNodes.length > 2) self.examples.removeChild(self.examples.lastChild);
          for(let exampleName in exampleObj) {
            let exDiv = document.createElement("option");
            exDiv.value = exDiv.textContent = exampleName;
            self.examples.appendChild(exDiv);
          }
        }

        fetch(window.location.href + "/resources/data/examples.json").then(r => r.json()).then(j => updateExamples(j));

        this.inputData = document.getElementById("inputData");
        this.inputDataText = document.getElementById("inputDataText");
        this.inputMeta = document.getElementById("inputMeta");
        this.inputMetaText = document.getElementById("inputMetaText");
        this.inputOverride = document.getElementById("inputOverride");
        this.inputOverrideText = document.getElementById("inputOverrideText");

        inputDataLabel.onclick = function() {self.inputData.click();}
        inputMetaLabel.onclick = function() {self.inputMeta.click();}
        inputOverrideLabel.onclick = function() {self.inputOverride.click();}

        inputData.onchange = function() {self.inputDataText.textContent = inputData.files[0].name;}
        inputMeta.onchange = function() {self.inputMetaText.textContent = inputMeta.files[0].name;}
        inputOverride.onchange = function() {self.inputOverrideText.textContent = inputOverride.files[0].name;}


        this.examples.onchange = function() {
          let selectedValue = self.examples.options[self.examples.selectedIndex].value;
          if(selectedValue == "None") {
            self.inputDataText.textContent = self.inputMetaText.textContent = self.inputOverrideText.textContent = "No file chosen";
            inputDataLabel.classList.remove("btndisable");
            inputMetaLabel.classList.remove("btndisable");
            inputOverrideLabel.classList.remove("btndisable");
          } else {
            self.inputData.value = self.inputMeta.value = self.inputOverride.value = "";
            inputDataLabel.classList.add("btndisable");
            inputMetaLabel.classList.add("btndisable");
            inputOverrideLabel.classList.add("btndisable");

            self.inputDataText.textContent = exampleObj[selectedValue].data;
            self.inputMetaText.textContent = exampleObj[selectedValue].meta;
            self.inputOverrideText.textContent = exampleObj[selectedValue].override;
          }
        }

        function resetProgress() {
            setLoadingStep("");
            setLoadingProgress(0);
        }

        document.getElementById("mapperSubmitRun").onclick = function() {
            setLoadingStep("loading data...", 1, 4);
            setLoadingProgress(0.5);

            self._tryGetDataFile(function(dataFile) {
                if(!window.Worker)  throw "Current brower does not support WebWorkers";

                if(self.myWorker) {
                    self.myWorker.terminate();
                    self.myWorker = undefined;
                }

                self.myWorker = new Worker("resources/js/worker.js");
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
                            resetProgress();
                        });
                    }
                }

                self.myWorker.onerror = function (e) {
                    console.error(e.message);
                    window.alert(e.message);
                };
            }, resetProgress);
        }

        document.getElementById("mapperSubmitLoad").onclick = function() {
            setLoadingStep("loading data...", 1, 2);
            setLoadingProgress(0.5);

            self._tryGetDataFile(function(dataFile) {
                setLoadingStep("loading mapper object...", 2, 2);
                setLoadingProgress(0.5);
                self._tryGetOverrideFile(function(overrideFile) {
                    //1. Load override mapper object directly
                    //2. Load data file for headings column
                    //3. Load metadata file using headings column

                    let or = new FileReader();
                    or.onload = function(ore) {
                        let mapperObject = JSON.parse(ore.target.result);
                        MatrixReader.ReadMatrixFromFile(dataFile, function(dataArray, headingsKey, conversionCount) {
                            self._getMetaAsync(headingsKey, function(metaObject) {
                                self.OnMapperFileChange(mapperObject, metaObject, Object.keys(headingsKey));
                                resetProgress();
                            });
                        });
                    }
                    or.readAsText(overrideFile);
                }, resetProgress);
            }, resetProgress);
        }
    }

    _tryGetDataFile(success, failure) {
        let fallbackURL = undefined;
        if(this.examples.options[this.examples.selectedIndex].value != "none") {
            fallbackURL = this.inputDataText.textContent;
        }
        this._tryGetFile(this.inputData, true, fallbackURL, success, failure);
    }

    _tryGetMetaFile(callback) {
        let fallbackURL = undefined;
        if(this.examples.options[this.examples.selectedIndex] != "none") {
            fallbackURL = this.inputMetaText.textContent;
        }
        this._tryGetFile(this.inputMeta, false, fallbackURL, callback);
    }

    _tryGetOverrideFile(success, failure) {
        let fallbackURL = undefined;
        if(this.examples.options[this.examples.selectedIndex].value != "none") {
            fallbackURL = this.inputOverrideText.textContent;
        }
        this._tryGetFile(this.inputOverride, true, fallbackURL, success, failure);
    }

    _tryGetFile(element, required, fallbackURL, success, failure=undefined) {
        element.setCustomValidity("");
        if(element.files[0]) {
            success(element.files[0]);
        } else if(fallbackURL) {
            fetch(window.location.href + "resources/data" + fallbackURL, {cache: "force-cache"}).then(r => r.blob()).then(b => success(new File([b], fallbackURL.replace(/^.*[\\\/]/, ''))));
        } else if(required){
            element.setCustomValidity("File required");
            element.reportValidity();
            if(failure) failure(undefined);
            else throw "Data file required";
        }
    }

    _UpdateAvailableFilterFunc(filterdim, filterfunc) {
        let valid = -1;
        for(let i=0; i<this.filterCompatibility.length; ++i) {
          if(!this.filterCompatibility[i] || this.filterCompatibility[i] == (filterdim.selectedIndex + 1)) {
            filterfunc.options[i].disabled = false;
            filterfunc.options[i].hidden = false;
            if(valid < 0) valid = i;
          } else {
            filterfunc.options[i].disabled = true;
            filterfunc.options[i].hidden = true;
          }
        }

        filterfunc.selectedIndex = valid;
    }

    //Thing to match is first column of each row
    _getMetaAsync(headingsKey, callback) {
        this._tryGetMetaFile(function(metafile) {
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
