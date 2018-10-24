var variableTypes = {};
TYPE_DISCRETE = 1;
TYPE_CONTINUOUS = 2;

class Parser {
    static fromTDAMapper(mapperObject, dataObject) {
        var metaVars = Object.keys(dataObject);

        //Initiallise types
        variableTypes = new Array(metaVars);

        //Parse mapper into data objects
        var bins = new Array(mapperObject.num_vertices);
        for(let i=0; i<bins.length; i++) {
            bins[i] = new Bin(mapperObject.level_of_vertex[i], mapperObject.points_in_vertex[i]);
        }

        
        for(let i=0; i<metaVars.length; i++) {
            if(!dataObject[metaVars[i]].length) continue;

            variableTypes[metaVars[i]] = isNaN(dataObject[metaVars[i]][0]) ? TYPE_DISCRETE : TYPE_CONTINUOUS;

            if(variableTypes[metaVars[i]] == TYPE_CONTINUOUS) {
                //Calculate normalised means for each continuous variables
                var max = -Infinity;
                var min = Infinity;
                for(let j=0; j<dataObject[metaVars[i]].length; j++) {
                    var val = dataObject[metaVars[i]][j];
                    if(val > max) max = val;
                    if(val < min) min = val;
                }
                
                for(let j=0; j<mapperObject.num_vertices; j++) {
                    //Store values and calculate mean
                    var mean = 0;
                    var values = new Array(mapperObject.points_in_vertex[j].length);
                    for(let k=0; k<values.length; k++) {
                        values[k] = dataObject[metaVars[i]][mapperObject.points_in_vertex[j][k]-1];
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
                    bins[j].mean[metaVars[i]] = (mean - min)/(max - min);
                    bins[j].min[metaVars[i]] = min;
                    bins[j].max[metaVars[i]] = max;
                    bins[j].sd[metaVars[i]] = sd;
                }
            } else {
                //Calculate lists of catagorical variables
                for(let j=0; j<mapperObject.num_vertices; j++) {
                    bins[j].catagories[metaVars[i]] = {};
                    
                    for(let k=0; k<mapperObject.points_in_vertex[j].length; k++) {
                        let key = dataObject[metaVars[i]][mapperObject.points_in_vertex[j][k]-1];
                        let dict =  bins[j].catagories[metaVars[i]];
                        dict[key] += (dict[key] || 0) + 1;
                    }
                }
            }
        }
        return bins;
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
        this.catagories = {};
	}
}