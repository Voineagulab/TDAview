if( 'undefined' === typeof window){

importScripts('../../vendors/papaparse/papaparse.min.js', '../../vendors/mapper/mapper-1d.js', '../../vendors/mapper/mapper-2d.js', '../../vendors/mapper/cutoff.js', '../../vendors/ml/ml.min.js', 'matrix-reader.js');

this.onmessage = function(e) {
    let warning = undefined;

    MatrixReader.ReadMatrixFromFile(e.data.dataFile, function(dataArray, headingsKey, conversionCount) {
        if(conversionCount > 0) warning = (conversionCount + " numeric data NAs converted to zeros");

        let colCount = dataArray[0].length;

        let matrix = new ML.Matrix(dataArray);
        let dist = new ML.Matrix(colCount, colCount);

        let cells = (colCount * (colCount + 1)) / 2;

        this.postMessage({progressstep: {text: "calculating distance matrix...", currstep: 2, numstep: 4}});
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

        let mapperObj = undefined;
        let filter = undefined;

        if(e.data.filterFunc == "CMDS") {
            this.postMessage({progressstep: {text: "running classical mds...", currstep: 3, numstep: 4}});

            let m = dist.clone();

            // square distances
            m.multiply(-0.5).pow(2);

            // double centre the rows/columns
            function mean(arr) {
              let sum = 0;
              for(let j=0; j<arr.length; ++j) {
                sum += arr[j];
              }
              return sum / arr.length;
            }

            function means(mat) {
              let sum = 0;
              let ret = new Array(mat.cols);
              for(let i=0; i<mat.cols; ++i) {
                ret[i] = mean(mat[i])
              }
              return ret;
            }

            let rowMeans = means(m);
            let colMeans = means(new ML.MatrixLib.MatrixTransposeView(m));
            let totalMean = mean(rowMeans);

            for(let i=0; i<m.cols; ++i) {
              for(let j=0; j<m.rows; ++j) {
                  m[i][j] += totalMean - rowMeans[i] - colMeans[j];
              }
            }

            let svd = new ML.MatrixLib.SingularValueDecomposition(m);

            const singularValues = svd.diagonal;
            const eigenvalues = [];
            for (const singularValue of singularValues) {
              eigenvalues.push((singularValue * singularValue) / (m.rows - 1));
            }

            let u = svd.leftSingularVectors;
            for(let i=0; i<u.cols; ++i) {
              u.mulRowVector(i, eigenvalues);
            }

            this.postMessage({progressstep: {text: "running mapper...", currstep: 4, numstep: 4}});
            mapperObj = mapper1D(dist, new ML.MatrixLib.MatrixSubView(u, 0, u.rows-1, 0, e.data.filterDim-1).to2DArray());
        } else {
            this.postMessage({progressstep: {text: "running pca...", currstep: 3, numstep: 4}});

            let pca = new ML.PCA(matrix, {method: "SVD"});

            this.postMessage({progressstep: {text: "running mapper...", currstep: 4, numstep: 4}});
            if(e.data.filterDim == 1) {
                if(e.data.filterFunc == "PCAEV1") {
                    filter = pca.getEigenvectors().getColumn(0); //Equivalent to pca.getLoadings().getColumn(0) but faster (no transpose)
                } else if(e.data.filterFunc == "PCAEV2") {
                    filter = pca.getEigenvectors().getColumn(1);
                } else {
                    throw "Unknown filter function";
                }
                if(filter[0] < 0) for(let i=0; i<filter.length; ++i) filter[i] = -filter[i]; //fix_sign
                mapperObj = mapper1D(dist, filter, e.data.numintervals, e.data.percentoverlap, e.data.numbins);
            } else {
                if(e.data.filterFunc == "PCAEV1,2") {
                    filter = [pca.getEigenvectors().getColumn(0), pca.getEigenvectors().getColumn(1)];
                } else {
                    throw "Unknown filter function";
                }
                for(let j=0; j<2; ++j) if(filter[j][0] < 0) for(let i=0; i<filter[j].length; ++i) filter[j][i] = -filter[j][i]; //fix_sign
                mapperObj = mapper2D(dist, filter, [e.data.numintervals,e.data.numintervals], e.data.percentoverlap, e.data.numbins);
            }
        }


        self.postMessage({progress: 1.0, mapper: mapperObj, headingsKey: headingsKey, warning: warning});
    });
}
}
