var mins = {};
var maxes = {};
var counts = {};

//TODO: something wrong with continuous means
class Parser {
    static fromTDAMapper(mapperObject, dataObject, metaArray) {
        //Parse mapper into data objects
        var bins = new Array(mapperObject.num_vertices);
        for(let i=0; i<bins.length; i++) {
            bins[i] = new Bin(mapperObject.level_of_vertex[i], mapperObject.points_in_vertex[i]);
        }
 
        //Parse continuous variables used in clustering
        if(dataObject) {
            for(var con in dataObject) {
                var conValue = dataObject[con];
    
                //Calculate normalised means for each continuous variable value
                var max = -Infinity;
                var min = Infinity;
                for(let j=0; j<conValue.length; j++) {
                    var val = conValue[j];
                    if(val > max) max = val;
                    if(val < min) min = val;
                }
    
                mins[con] = min;
                maxes[con] = max;
                
                for(let j=0; j<mapperObject.num_vertices; j++) {
                    //Store values and calculate mean
                    var mean = 0;
                    var values = new Array(mapperObject.points_in_vertex[j].length || 0);
                    for(let k=0; k<values.length; k++) {
                        values[k] = conValue[mapperObject.points_in_vertex[j][k]-1];
                        mean += values[k];
                    }
                    mean /= values.length;
    
                    //Calculate standard deviation
                    var sd = 0;
                    for(let k=0; k<values.length; k++) {
                        sd += Math.pow(values[k] - mean, 2);
                    }
                    sd /= values.length;
                    sd = Math.sqrt(sd);
    
    
                    //Save normallised mean, min, max and standard deviation
                    bins[j].mean[con] = mean;
                    bins[j].sd[con] = sd;
                }
            }
        }

        //Calculate total counts of each category
        for(let j=0; j<metaArray.length; j++) {
            var key = metaArray[j];
            counts[key] = (counts[key] || 0) + 1;
        }

        //Calculate category dictionary for each bin
        for(let j=0; j<bins.length; j++) {
            //Ensure object exists for each option of the category
            let binCountDict = {};
            for(let k=0; k<metaArray.length; k++) {
                if(!binCountDict[metaArray[k]]) {
                    binCountDict[metaArray[k]] = 0;
                }
            }

            //Calculate counts for each object
            for(let k=0; k<mapperObject.points_in_vertex[j].length; k++) {
                let key = metaArray[mapperObject.points_in_vertex[j][k]-1];
                binCountDict[key]++;
            }

            //Calculate means for each object and save min/max to static variable
            var length = Object.keys(binCountDict).length;
            for(var key in binCountDict) {
                var binCount = binCountDict[key];
                bins[j].mean[key] = binCount / length;

                if(!mins[key] || binCount < mins[key]) mins[key] = binCount;
                if(!maxes[key] || binCount > maxes[key]) maxes[key] = binCount;
            }
        }

        for(let i=0; i<bins.length; i++) {
            for(let key in bins[i].means) {
                bins[i].means[key] = (bins[i].means[key] - bins[i].min[key]) / (bins[i].max[key] - bins[i].min[key]);
            }
        }
        console.log(bins);
        return bins;
    }

    //Returns the minimum count of a particular variable in ANY bin
    static getMin(value) {
        return mins[value];
    }

    //Returns the maximum count of a particular variable in ANY bin
    static getMax(value) {
        return maxes[value];
    }

    static getCategories() {
        return Object.keys(counts);
    }


    static fromPhom() {
        
    }

    static getVariableType(name) {
        return variableTypes[name];
    }
}

class Bin {
	constructor(level, points) {
		this.level = level;
        this.points = points;
        this.mean = {};
        this.min = {};
        this.max = {};
        this.sd = {};
	}
}