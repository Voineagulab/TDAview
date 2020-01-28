class MenuLoadData {
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
        this.dataFile = document.getElementById("inputData");
        this.metaFile = document.getElementById("inputMeta");
    }

    getDataFile() {
        return this.dataFile.files[0];
    }

    getMetaFile() {
        return this.metaFile.files[0];
    }

    setDataFileValidity(message) {
        this.dataFile.setCustomValidity(message);
        this.dataFile.reportValidity();
    }

    //Thing to match is first column of each row
    getMetaAsync(headingsKey, callback) {
        if(!this.getMetaFile()) {
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
        reader.readAsText(this.getMetaFile());
    }
}
