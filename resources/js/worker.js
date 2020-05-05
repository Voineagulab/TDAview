if( 'undefined' === typeof window){

importScripts('../../vendors/papaparse/papaparse.min.js', '../../vendors/mapper/mapper-1d.js', '../../vendors/mapper/mapper-2d.js', '../../vendors/mapper/cutoff.js', '../../vendors/ml/ml.min.js', 'matrix-reader.js', 'data-utility.js');

this.onmessage = function(e) {
    let warning = undefined;

    try {
    MatrixReader.ReadMatrixFromFile(e.data.dataFile, function(dataArray, headings, headingsKey, conversionCount) {
        if(conversionCount > 0) warning = (conversionCount + " numeric data NAs converted to zeros");

        let colCount = dataArray[0].length;
        let matrix = new ML.Matrix(dataArray);
        let dist = undefined;

        let cells = (colCount * (colCount + 1)) / 2;
        
        if(e.data.distCache !== undefined) {
            this.postMessage({progressstep: {text: "retrieving cached distance matrix...", currstep: 2, numstep: 4}});
            dist = new ML.Matrix(e.data.distCache.data);
        } else {
            this.postMessage({progressstep: {text: "calculating distance matrix...", currstep: 2, numstep: 4}});
            dist = new ML.Matrix(colCount, colCount);
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
        }

        let mapperObj = undefined;
        let filter = undefined;

        if(e.data.filterCache !== undefined) {
            this.postMessage({progressstep: {text: "retrieving cached filter values...", currstep: 3, numstep: 4}});
            filter = e.data.filterCache;
        } else {
            if(e.data.filterFunc == "Mean") {
                filter = [new Array(dataArray[0].length), new Array(dataArray[0].length)];
                for(let j=0; j<dataArray[0].length; ++j) filter[0][j] = Utility.Mean(...dataArray.map(a => a[j]));
            } else if(e.data.filterFunc == "Min") {
                filter = [new Array(dataArray[0].length), new Array(dataArray[0].length)];
                for(let j=0; j<dataArray[0].length; ++j) filter[0][j] = Utility.Min(...dataArray.map(a => a[j]));
            } else if(e.data.filterFunc == "Max") {
                filter = [new Array(dataArray[0].length), new Array(dataArray[0].length)];
                for(let j=0; j<dataArray[0].length; ++j) filter[0][j] = Utility.Max(...dataArray.map(a => a[j]));
            } else if(e.data.filterFunc == "CMDS") {
                this.postMessage({progressstep: {text: "running classical mds...", currstep: 3, numstep: 4}});
    
                let m = dist.clone();
    
                //Square distance matrix
                m.pow(2).multiply(0.5);
    
                //Double center
                let rowMeans = m.mean("row");
                colMeans = m.mean("column");
                totalMean = (new ML.MatrixLib.WrapperMatrix1D(rowMeans)).mean();
                for(let i=0; i<m.data.length; ++i) for(let j=0; j<m.data[0].length; ++j) m.data[i][j] += totalMean - rowMeans[i] - colMeans[j];
    
                //Perform SVD
                let svd = new ML.MatrixLib.SingularValueDecomposition(m);
                let eigenVals = svd.s.map(v => Math.sqrt(v));
                filter = new ML.MatrixLib.MatrixTransposeView(new ML.MatrixLib.MatrixSubView(svd.U, 0, svd.U.rows-1, 0, e.data.filterDim-1)).to2DArray();
                for(let i=0; i<filter.length; ++i) for(let j=0; j<filter[0].length; ++j) filter[i][j] *= eigenVals[i];
            } else {
                this.postMessage({progressstep: {text: "running pca...", currstep: 3, numstep: 4}});
    
                let pca = new ML.PCA(matrix, {method: "SVD"});
                filter = [pca.getEigenvectors().getColumn(0), pca.getEigenvectors().getColumn(1)];
                for(let j=0; j<2; ++j) if(filter[j][0] < 0) for(let i=0; i<filter[j].length; ++i) filter[j][i] = -filter[j][i]; //fix_sign
            }
        }

        this.postMessage({progressstep: {text: "running mapper...", currstep: 4, numstep: 4}});
        
        console.log("values:");
        console.log(dist);
        console.log(filter);

        if(e.data.filterDim == 1) {
            mapperObj = mapper1D(dist, (e.data.filterFunc == "PCAEV2" ? filter[1] : filter[0]), e.data.numintervals, e.data.percentoverlap, e.data.numbins);
        } else {
            mapperObj = mapper2D(dist, filter, [e.data.numintervals, e.data.numintervals], e.data.percentoverlap, e.data.numbins);
        }
        self.postMessage({progress: 1.0, mapper: mapperObj, headings: headings, headingsKey: headingsKey, warning: warning, distCache: dist, filterCache: filter});
    });
} catch(error) {
    self.postMessage({error: error});
}
}
}
