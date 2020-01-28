class MenuRunMapper {
    constructor(element, tryGetDataFile, getMetaAsync, setLoadingProgress) {
        this.domElement = document.createElement("span");
        this.domElement.innerHTML = this.generateHTML();
        element.appendChild(this.domElement);

        this._init(tryGetDataFile, getMetaAsync, setLoadingProgress);
    }

    generateHTML() {
        return /*html*/`
        <fieldset>
        <legend>Mapper</legend>
            <form id="mapperRunForm">
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
                <font size="2">Distance Measure</font><br>
                <select id="distfunc">
                    <option value="euclidean">Euclidean</option>
                    <option value="absolutepearson">Absolute Pearson</option>
                </select>
                <br><br>
                <font size="2">Filtration Function</font><br>
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

    _init(tryGetDataFile, getMetaAsync, setLoadingProgress) {
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

        document.getElementById("mapperRunForm").addEventListener('submit', function(event) {
            event.preventDefault();

            //1. Load data using webworker, which also returns headings column
            //2. Load metadata file using headings column

            let dataFile = tryGetDataFile();

            if(!window.Worker)  throw "Current brower does not support WebWorkers";

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
              numintervals: numintervals.value,
              percentoverlap: percentoverlap.value,
              numbins: numbins.value
            });

            console.log(numintervals.value);
            console.log(percentoverlap.value);
            console.log(numbins.value);

            self.myWorker.onmessage = function(e){
                if(e.data.warning) {
                    console.warn(e.data.warning);
                    window.alert(e.data.warning);
                }

                setLoadingProgress(e.data.progress);

                if(e.data.mapper) {
                    getMetaAsync(e.data.headingsKey, function(metaObject) {
                        self.OnMapperFileChange(e.data.mapper, metaObject, Object.keys(e.data.headingsKey));
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

    OnMapperFileChange(mapperObject, metaObject, rownames) {}
}
