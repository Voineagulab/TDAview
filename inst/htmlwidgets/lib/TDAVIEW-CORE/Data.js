const DATA_TYPE_NUMBER = 1;
const DATA_TYPE_CATEGORY = 2;
const DATA_TYPE_ID = 3;
const DATA_TYPE_DATE = 4;

class Utility {
    static Min(array) {
        return Math.min(...array);
    }

    static Max(array) {
        return Math.max(...array);
    }

    static Mean(array) {
        let mean = 0.0;
        for(let i=0; i<array.length; i++) {
            mean += array[i];
        }
        return mean / array.length;
    }

    static SD(array) {
        let sd = 0;
        let mean = this.Mean(array);
        for(let i=0; i<array.length; i++) {
            sd +=  Math.pow(array[i] - mean, 2);
        }
        sd /= array.length;
        return Math.sqrt(sd);
    }

    static Normalised(value, min, max) {
        return (value - min) / (max - min);
    }
}

class Data {
    static generateRandom() {
        var mapper = {};
        var metadata = {};
        mapper.num_vertices = 100;
        mapper.adjacency = new Array(mapper.num_vertices);
        mapper.points_in_vertex = new Array(mapper.num_vertices);
        var num_points = mapper.num_vertices * 20;
        metadata.Intake = new Array(num_points);
        metadata.Condition = new Array(num_points);
        var condition_categories = ["None", "Mild", "Moderate", "Severe"];
        for(let i=0; i<mapper.adjacency.length; i++) {
            mapper.adjacency[i] = new Array(mapper.num_vertices);
            for(let j=0; j<mapper.adjacency[i].length; j++) {
                mapper.adjacency[i][j] = Math.round(Math.random()*0.508);
            }
            metadata.Intake[i] = Math.random();
            metadata.Condition[i] = condition_categories[Math.floor(Math.random() * (condition_categories.length-1))];
            mapper.points_in_vertex[i] = {[("Sample_" + (i))]: (i)};
        }

        
        for(let i=mapper.num_vertices; i<num_points; i++) {
            metadata.Intake[i] = Math.random();
            metadata.Condition[i] = condition_categories[Math.round(Math.random() * (condition_categories.length-1))];
            mapper.points_in_vertex[Math.round(Math.random() * (mapper.num_vertices-1)) ][("Sample_" + (i))] = (i);
        }

        return new Data(mapper, metadata);
    }

    constructor(mapper, metadata, rowNames) {
        this.rowNames = rowNames;
        this.metadata = metadata;
        this.mapper = mapper;
        this.maxBinPoints = Utility.Max(mapper.points_in_vertex.map(obj => Object.keys(obj).length));

        this.name = undefined;
        this.variable = new CachedVariable();
        this.mins = new ContinuousVariable();
        this.maxs = new ContinuousVariable();

        //Create bins for each node
        this.bins = new Array(mapper.num_vertices);
        for(let i=0; i<mapper.num_vertices; i++) {
            this.bins[i] = new Bin(mapper.points_in_vertex[i]);
        }

        //Determine defined types of variables
        this.types = {};
        let conversionCount = 0;
        for(var key in metadata) {
            let data = this.metadata[key];
            for(let i=0; i<data.length; i++) {
                if(data[i] != null && data[i] != "NA") {
                    this.types[key] = isNaN(data[i]) ? DATA_TYPE_CATEGORY : DATA_TYPE_NUMBER;
                    break;
                }
            }

            if(this.types[key] === undefined) this.types[key] = DATA_TYPE_CATEGORY; //All NA treated as categorical
            else if(this.types[key] == DATA_TYPE_NUMBER) {
                for(let i=0; i<data.length; ++i) {
                    data[i] = parseFloat(data[i]);
                    if(data[i] == NaN) {
                        ++conversionCount;
                        data[i] = 0;
                    }
                }
            }
        }
        if(conversionCount > 0) window.alert(conversionCount + " numeric metadata NAs converted to zeros");
    }

    getHasNodeLabels() {
        return this.hasNodeNames;
    }

    getAdjacency() {
        return this.mapper.adjacency;
    }

    getMapper() {
        return this.mapper;
    }

    getBins() {
        return this.bins;
    }

    getRowName(index) {
        return this.rowNames[index];
    }

    loadVariable(name) {
        if(this.metadata.hasOwnProperty(name) && name !== this.name) {
            this.name = name;
            this.variable.setIsCategorical(this.types[name] === DATA_TYPE_CATEGORY);
            if(this.variable.getIsCategorical()) {
                this.variable.getCategorical().setFromEntries(this.metadata[name]);
                for(let i=0; i<this.bins.length; i++) {
                    let entries = this.bins[i].getPoints().map(value => this.metadata[name][value-1]);
                    this.bins[i].getCategorical().setFromEntries(entries);
                }
            } else {
                this.variable.getContinuous().setFromEntries(this.metadata[name]);
                this.mins.setProperties(Infinity, Infinity, Infinity, Infinity);
                this.maxs.setProperties(-Infinity, -Infinity, -Infinity, -Infinity);
                for(let i=0; i<this.bins.length; i++) {
                    let localVariable = this.bins[i].getContinuous();
                    localVariable.setFromEntries(this.bins[i].getPoints().map(value => this.metadata[name][value-1]));
                    this.mins.transformProperties(localVariable, Math.min);
                    this.maxs.transformProperties(localVariable, Math.max);
                }
            }
        } 
    }

    getContinuousNormalised(bin, property) {
        return Utility.Normalised(bin.getContinuous()[property], this.mins[property], this.maxs[property]);
    }

    getContinuousMin(property) {
        return this.mins[property];
    }   

    getContinuousMax(property) {
        return this.maxs[property];
    }

    getPointsNormalised(bin) {
        return bin.getPointCount() / this.maxBinPoints;
    }

    getVariable() {
        return this.variable;
    }

    getVariableNames() {
        return Object.keys(this.metadata);
    }

    getContinuousNames() {
        return this.getVariableNames().filter(name => this.types[name] === DATA_TYPE_NUMBER);
    }

    getCategoricalNames() {
        return this.getVariableNames().filter(name => this.types[name] === DATA_TYPE_CATEGORY);
    }

    getPointNames(bin) {
        return Object.keys(bin.points).map(p => this.rowNames[p]);
    }
}


class ContinuousVariable {
    constructor(min=0, max=0, mean=0, sd=0) {
        this.setProperties(min, max, mean, sd);
    }

    setFromEntries(entries) {
        this.setProperties(Utility.Min(entries), Utility.Max(entries), Utility.Mean(entries), Utility.SD(entries));
    }

    setProperties(min, max, mean, sd) {
        this.min = min;
        this.max = max; 
        this.mean = mean;
        this.sd = sd;
    }

    transformProperties(variable, func) {
        this.min = func(this.min, variable.min);
        this.max = func(this.max, variable.max);
        this.mean = func(this.mean, variable.mean);
        this.sd = func(this.sd, variable.sd);
    }
}

class CategoricalVariable {
    constructor(counts=undefined, sum=undefined) {
        this.counts = counts;
        this.sum = sum;
    }

    setFromEntries(entries) {
        var counts = {};
        for(let i=0; i<entries.length; i++) {
            counts[entries[i]] = (counts[entries[i]] || 0) + 1;
        }
        this.setProperties(counts, entries.length);
    }

    setProperties(counts, sum) {
        this.counts = counts;
        this.sum = sum;
    }

    getCount(category) {
        return this.counts[category] || 0;
    }

    getSum() {
        return this.sum;
    }

    getCategories() {
        return Object.keys(this.counts);
    }

    getValues() {
        return Object.values(this.counts);
    }

    getValuesNormalised() {
        return Object.values(this.counts).map(value => value / this.sum);
    }
}

class CachedVariable {
    constructor() {
        this.isCatagorical = undefined;
        this.continuous = new ContinuousVariable();
        this.categorical = new CategoricalVariable();
    }

    setIsCategorical(isCatagorical) {
        this.isCatagorical = isCatagorical;
    }

    getIsCategorical() {
        return this.isCatagorical;
    }

    getCategorical() {
        return this.categorical;
    }

    getContinuous() {
        return this.continuous;
    }
}

class Bin extends CachedVariable {
    constructor(points) {
        super();
        this.points = points;
    }

    getPointCount() {
        return this.getPoints().length;
    }

    getPoints() {
        return Object.values(this.points);
    }
}