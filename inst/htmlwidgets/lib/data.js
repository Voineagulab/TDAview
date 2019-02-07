class Utility {
    static Min(array) {
        return Math.min(...array);
    }

    static Max(array) {
        return Math.max(...array);
    }

    static Mean(array) {
        let mean = 0;
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
        mapper.num_vertices = 1000;
        mapper.adjacency = new Array(mapper.num_vertices);
        mapper.points_in_vertex = new Array(mapper.num_vertices);
        var num_points = mapper.num_vertices * 20;
        var intake = new Array(num_points+1);
        intake[0] = "Intake";
        var condition = new Array(num_points+1);
        condition[0] = "Condition";
        var condition_categories = ["None", "Mild", "Moderate", "Severe"];
        for(let i=0; i<mapper.adjacency.length; i++) {
            mapper.adjacency[i] = new Array(mapper.num_vertices);
            for(let j=0; j<mapper.adjacency[i].length; j++) {
                mapper.adjacency[i][j] = Math.round(Math.random()*0.500525);
            }
            intake[i+1] = Math.random();
            condition[i+1] = condition_categories[Math.floor(Math.random() * (condition_categories.length-1))];
            mapper.points_in_vertex[i] = [i+1];
        }

        for(let i=mapper.num_vertices; i<num_points; i++) {
            intake[i+1] = Math.random();
            condition[i+1] = condition_categories[Math.round(Math.random() * (condition_categories.length-1))];
            mapper.points_in_vertex[Math.round(Math.random() * (mapper.num_vertices-1)) ].push(i+1);
        }
        return new Data(mapper, [intake, condition]);
    }

    constructor(mapper, metadata) {
        this.metadata = metadata;
        this.adjacency = mapper.adjacency;
        this.maxBinPoints = Utility.Max(mapper.points_in_vertex.map(array => array.length));
        
        this.currentIndex = undefined;
        this.indices = metadata.map(column => column[0]).reduce((map, name, index) => (map[name] = index, map), {});

        this.variable = new CachedVariable();
        this.mins = new ContinuousVariable();
        this.maxs = new ContinuousVariable();
        
        this.bins = new Array(mapper.num_vertices);
        for(let i=0; i<mapper.num_vertices; i++) {
            this.bins[i] = new Bin(mapper.points_in_vertex[i]);
        }
    }

    getAdjacency() {
        return this.adjacency;
    }

    getBins() {
        return this.bins;
    }

    loadVariable(name) {
        let index = this.metadata.findIndex(col => col[0] === name);
        if(index >= 0 && index !== this.currentIndex) {
            this.currentIndex = index;
            this.variable.setIsCategorical(isNaN(this.metadata[index][1]));
            if(this.variable.getIsCategorical()) {
                this.variable.getCategorical().setFromEntries(this.metadata[index].slice(1));
                for(let i=0; i<this.bins.length; i++) {
                    let entries = this.bins[i].points.map(value => this.metadata[index][value]).slice(1);
                    this.bins[i].getCategorical().setFromEntries(entries);
                }
            } else {
                this.variable.getContinuous().setFromEntries(this.metadata[index].slice(1));
                this.mins.setProperties(Infinity, Infinity, Infinity, Infinity);
                this.maxs.setProperties(-Infinity, -Infinity, -Infinity, -Infinity);
                for(let i=0; i<this.bins.length; i++) {
                    let localVariable = this.bins[i].getContinuous();
                    localVariable.setFromEntries(this.bins[i].points.map(value => this.metadata[index][value]).slice(1));
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
        return this.metadata.map(column => column[0]);
    }

    getContinuousNames() {
        return this.metadata.map(column => column[0]).filter((name, index) => !isNaN(this.metadata[index][1]));
    }

    getCategoricalNames() {
        return this.metadata.map(column => column[0]).filter((name, index) => isNaN(this.metadata[index][1]));
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
        return this.points.length;
    }
}