class Parser {
    static fromTDAMapper(mapperObject, dataObject) {
        //Parse mapper into data objects
        var bins = new Array(mapperObject.num_vertices);
        for(let i=0; i<bins.length; i++) {
            bins[i] = new Bin(mapperObject.level_of_vertex[i], mapperObject.points_in_vertex[i]);
        }

        //Calculate normalised means for each meta var
        var metaVars = Object.keys(dataObject);
        for(let i=0; i<metaVars.length; i++) {
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
        }
        return bins;
    }


    static fromPhom() {
        
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