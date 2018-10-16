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
                var sum = 0;
                var count = mapperObject.points_in_vertex[j].length;
                for(let k=0; k<count; k++) {
                    sum += dataObject[metaVars[i]][mapperObject.points_in_vertex[j][k]-1];
                }
                bins[j].mean[metaVars[i]] = (sum/count - min)/(max - min);
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
	}
}