if( 'undefined' === typeof window){

importScripts('../../vendors/numeric/numeric.min.js', '../../vendors/papaparse/papaparse.min.js', '../../vendors/mapper/mapper-1d.js', '../../vendors/mapper/mapper-2d.js', '../../vendors/mapper/cutoff.js', '../../vendors/ml/ml.min.js', 'matrix-reader.js');

this.onmessage = function(e) {
    let warning = undefined;

    try {
    MatrixReader.ReadMatrixFromFile(e.data.dataFile, function(dataArray, headings, headingsKey, conversionCount) {
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



            /*
            let m = dist.clone();

            // square distances
            //m.pow(2).multiply(-0.5); //the mul step is not correct

            // double centre the rows/columns //note can use https://mljs.github.io/matrix/classes/abstractmatrix.html#center
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
                ret[i] = mean(mat.data[i])
              }
              return ret;
            }

            let rowMeans = means(m);
            let colMeans = means(new ML.MatrixLib.MatrixTransposeView(m));
            let totalMean = mean(rowMeans);

            for(let i=0; i<m.cols; ++i) {
              for(let j=0; j<m.rows; ++j) {
                  m.data[i][j] += totalMean - rowMeans[i] - colMeans[j];
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

            filter = new ML.MatrixLib.MatrixSubView(u, 0, u.rows-1, 0, e.data.filterDim-1).to2DArray();
            */

            //TODO: translate to ml js (above not working )
            //Credit: https://github.com/benfred/mds.js/blob/master/mds.js
            function mdsclassic(distances, dimensions) {
                dimensions = dimensions || 2;
        
                // square distances
                var M = numeric.mul(-0.5, numeric.pow(distances, 2));
        
                // double centre the rows/columns
                function mean(A) { return numeric.div(numeric.add.apply(null, A), A.length); }
                var rowMeans = mean(M),
                    colMeans = mean(numeric.transpose(M)),
                    totalMean = mean(rowMeans);
        
                for (var i = 0; i < M.length; ++i) {
                    for (var j =0; j < M[0].length; ++j) {
                        M[i][j] += totalMean - rowMeans[i] - colMeans[j];
                    }
                }
        
                // take the SVD of the double centred matrix, and return the
                // points from it
                var ret = numeric.svd(M),
                    eigenValues = numeric.sqrt(ret.S);
                return ret.U.map(function(row) {
                    return numeric.mul(row, eigenValues).splice(0, dimensions);
                });
            };

            filter = mdsclassic(dist.to2DArray(), e.data.filterDim);
            this.postMessage({progressstep: {text: "running mapper...", currstep: 4, numstep: 4}});

            if(e.data.filterDim == 1) {
                mapperObj = mapper1D(dist, filter, e.data.numintervals, e.data.percentoverlap, e.data.numbins);
            } else {
                mapperObj = mapper2D(dist, filter, [e.data.numintervals,e.data.numintervals], e.data.percentoverlap, e.data.numbins);
            }

            
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


        self.postMessage({progress: 1.0, mapper: mapperObj, headings: headings, headingsKey: headingsKey, warning: warning});
    });
} catch(error) {
    self.postMessage({error: error});
}
}
}
