if( 'undefined' === typeof window){

importScripts('../PAPAPARSE/papaparse.min.js', '../MAPPER/mapper1D.js', '../MAPPER/cutoff.js', '../MLJS/ml.min.js');

this.onmessage = function(e) {
    var reader = new FileReaderSync();
    
    let dataFile = e.data.dataFile;
    let dataCSV = reader.readAsText(dataFile).trim();
    let dataParsed = Papa.parse(dataCSV);

    if(dataParsed.meta.aborted) {
        throw "Invalid CSV";
    }

    let dataArray = dataParsed.data;
    
    for(let i=1; i<dataArray.length; ++i) {
        if(dataArray[i].length != dataArray[0].length) {
            throw "Invalid headers or column lengths";
        }
    }

    //Remove headings
    dataArray.shift(); 
    for(let i=0; i<dataArray.length; ++i) {
        dataArray[i].shift();
    }

    let matrix = new ML.Matrix(dataArray);
    let dist = new ML.Matrix(dataArray.length, dataArray.length);

    let squares = new Array(dataArray.length);
    for(let i=0; i<squares.length; ++i) {
        let col = new ML.MatrixLib.MatrixRowView(matrix, i);
        squares[i] = col.dot(col);
    }

    //Calculate L2 distance
    let cells = (dataArray.length * (dataArray.length + 1)) / 2;
    for(let i=0, k=0; i<dataArray.length; ++i) {
        for(let j=0; j<dataArray.length && j<=i; ++j, ++k) {
            let col1 = new ML.MatrixLib.MatrixRowView(matrix, i);
            let col2 = new ML.MatrixLib.MatrixRowView(matrix, j);
            let value = Math.sqrt(squares[i] - 2 * col1.dot(col2) + squares[j]);
            dist.set(i, j, value);
            dist.set(j, i, value);
            if(k%dataArray.length == 0) this.postMessage({progress: k/cells});
        }
    }

    let pca = new ML.PCA(new ML.MatrixLib.MatrixTransposeView(matrix), {method: "SVD"});
    let filter = pca.getEigenvectors().getRow(0);
    let mapperObj = mapper1D(dist, filter, 50, 50, 20);

    self.postMessage({progress: 1.0, mapper: mapperObj});   
}
}