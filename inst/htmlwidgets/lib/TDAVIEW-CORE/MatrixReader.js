class MatrixReader {
    static ReadMatrixFromFile(dataFile, callback) {
        if(typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) {
            let reader = new FileReaderSync();
            let dataCSV = reader.readAsText(dataFile).trim();
            MatrixReader.ReadMatrixFromString(dataCSV, callback);
        } else {
            let reader = new FileReader();
            reader.onload = function(e) {
                MatrixReader.ReadMatrixFromString(e.target.result.trim(), callback);
            }
            reader.readAsText(dataFile);
        }
    }

    static ReadMatrixFromString(dataCSV, callback) {
        let dataParsed = Papa.parse(dataCSV);
    
        if(dataParsed.meta.aborted) {
            throw "Invalid data CSV";
        }
    
        //Note: every array entry is a line therefore dataArray.length == row count
        var dataArray = dataParsed.data;
        
        for(let i=1; i<dataArray.length; ++i) {
            if(dataArray[i].length != dataArray[0].length) {
                throw "Invalid data headers or column lengths";
            }
        }
    
        //Remove headings
        var headingsKey = {};
        dataArray.shift(); 
        for(let i=0; i<dataArray.length; ++i) {
            headingsKey[dataArray[i][0]] = i;
            dataArray[i].shift();
        }
    
        let conversionCount = 0;
        for(let i=0; i<dataArray.length; ++i) {
            for(let j=0; j<dataArray[0].length; ++j) {
                if(isNaN(dataArray[i][j])) {
                    dataArray[i][j] = 0;
                    ++conversionCount;
                }
            }
        }
    
        callback(dataArray, headingsKey, conversionCount);
    }
}