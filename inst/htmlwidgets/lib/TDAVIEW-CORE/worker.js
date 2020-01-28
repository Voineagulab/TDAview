if( 'undefined' === typeof window){

importScripts('../PAPAPARSE/papaparse.min.js', '../MAPPER/mapper1D.js', '../MAPPER/mapper2D.js', '../MAPPER/cutoff.js', '../MLJS/ml.min.js', '../TDAVIEW-CORE/MatrixReader.js');

this.onmessage = function(e) {
    let warning = undefined;

    MatrixReader.ReadMatrixFromFile(e.data.dataFile, function(dataArray, headingsKey, conversionCount) {
        if(conversionCount > 0) warning = (conversionCount + " numeric data NAs converted to zeros");

        let colCount = dataArray[0].length;

        let matrix = new ML.Matrix(dataArray);
        let dist = new ML.Matrix(colCount, colCount);

        let cells = (colCount * (colCount + 1)) / 2;
        if(e.data.distFunc == "euclidean") {
            let squares = new Array(colCount);
            for(let i=0; i<squares.length; ++i) {
                let col = new ML.MatrixLib.MatrixColumnView(matrix, i);
                squares[i] = col.dot(col);
            }

            for(let i=0, k=0; i<colCount; ++i) {
                for(let j=0; j<colCount && j<=i; ++j, ++k) {
                    let col1 = new ML.MatrixLib.MatrixColumnView(matrix, i);
                    let col2 = new ML.MatrixLib.MatrixColumnView(matrix, j);
                    let value = Math.sqrt(squares[i] - 2 * col1.dot(col2) + squares[j]);
                    dist.set(i, j, value);
                    dist.set(j, i, value);
                    if(k%colCount == 0) this.postMessage({progress: k/cells});
                }
            }
        } else {
            let cov = new ML.MatrixLib.covariance(matrix);
            for(let i=0, k=0; i<colCount; ++i) {
                for(let j=0; j<colCount && j<=i; ++j, ++k) {
                    let squareDiff1 = 0;
                    let squareDiff2 = 0;
                    let mean1 = 0;
                    let mean2 = 0;
                    let col1 = new ML.MatrixLib.MatrixColumnView(matrix, i);
                    let col2 = new ML.MatrixLib.MatrixColumnView(matrix, j);
                    let value = 0;
                    for (let l=0; l < dataArray.length; ++l) {
                        mean1 += col1.get(l, 0);
                        mean2 += col2.get(l, 0);
                    }
                    mean1 /= dataArray.length;
                    mean2 /= dataArray.length;

                    for (let l=0; l < dataArray.length; ++l) {
                        squareDiff1 += Math.pow(col1.get(l, 0) - mean1, 2);
                        squareDiff2 += Math.pow(col2.get(l, 0) - mean2, 2);
                    }

                    value = 1 - Math.abs(cov.get(i, j) / (Math.sqrt(squareDiff1) * Math.sqrt(squareDiff2)));
                    dist.set(i, j, value);
                    dist.set(j, i, value);
                    if(k%colCount == 0) this.postMessage({progress: k/cells});
                }
            }
        }

        let pca = new ML.PCA(matrix, {method: "SVD"});
        let mapperObj = undefined;
        let filter = undefined;

        if(e.data.filterDim == 1) {
            if(e.data.filterFunc == "PCAEV1") {
                filter = pca.getEigenvectors().getColumn(0); //Equivalent to pca.getLoadings().getColumn(0) but faster (no transpose)
            } else if(e.data.filterFunc == "PCAEV2") {
                filter = pca.getEigenvectors().getColumn(1);
            } else {
                throw "Unknown filter function";
            }
            mapperObj = mapper1D(dist, filter, e.data.numintervals, e.data.percentoverlap, e.data.numbins);
        } else {
            if(e.data.filterFunc == "PCAEV1,2") {
                filter = [pca.getEigenvectors().getColumn(0), pca.getEigenvectors().getColumn(1)];
            } else {
                throw "Unknown filter function";
            }
            mapperObj = mapper2D(dist, filter, [e.data.numintervals,e.data.numintervals], e.data.percentoverlap, e.data.numbins);
        }
        self.postMessage({progress: 1.0, mapper: mapperObj, headingsKey: headingsKey, warning: warning});
    });
}
}
