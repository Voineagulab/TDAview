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

//Todo: order of categories gets messed up because of maps, store in array for legend
class Data {
    constructor(mapper, metadata) {
        this.adjacency = mapper.adjacency;
        
        this.variableNames = metadata.map(column => column[0]);
        this.variableIndices = this.variableNames.reduce((map, name, index) => (map[name] = index, map), {});

        this.maxPoints = Utility.Max(mapper.points_in_vertex.map(array => array.length));

        this.bins = new Array(mapper.num_vertices);
        for(let i=0; i<mapper.num_vertices; i++) {
            this.bins[i] = new Bin(i, this.getVariableNames().length, mapper.points_in_vertex[i].length);
        }

        this.variables = new Array(metadata.length);
        this.continuousMins = new Array(metadata.length);
        this.continuousMaxs = new Array(metadata.length);
        for(let i=0; i<metadata.length; i++) {
            let firstEntry = metadata[i][1];
            let globalEntries = metadata[i].slice(1);
            let isCatagorical = isNaN(firstEntry);

            this.variables[i] = isCatagorical ? CategoricalVariable.fromEntries(i, globalEntries) : ContinuousVariable.fromEntries(i, globalEntries);
            
            if(!isCatagorical) {
                this.continuousMins[i] = new ContinuousVariable(i, Infinity, Infinity, Infinity, Infinity);
                this.continuousMaxs[i] = new ContinuousVariable(i, -Infinity, -Infinity, -Infinity, -Infinity);
            }

            //Calculate local mins, maxes, means and standard deviates for each bin
            for(let j=0; j<mapper.num_vertices; j++) {
                let bin = this.bins[j];

                var localEntries = mapper.points_in_vertex[j].map(value => metadata[i][value]).slice(1); //not -1? k
                bin.setVariable(i, isCatagorical ? CategoricalVariable.fromEntries(i, localEntries) : ContinuousVariable.fromEntries(i, localEntries));

                if(!isCatagorical) {
                    let variable = bin.getVariable(i);
                    this.continuousMins[i].transformProperties(variable, Math.min);
                    this.continuousMaxs[i].transformProperties(variable, Math.max);
                }
            }
        }
    }

    getVariables() {
        return this.variables;
    }

    getVariableNames() {
        return this.variableNames;
    }

    getVariableName(varId) {
        return this.variableNames[varId];
    }

    getVariableByName(name) {
        return this.variables[this.getVariableId(name)];
    }

    getVariableId(name) {
        return this.variableIndices[name];
    }

    getVariableById(varId) {
        return this.variables[varId];
    }

    getBins() {
        return this.bins;
    }

    getBinById(binId) {
        return this.bins[binId];
    }

    getAdjacency() {
        return this.adjacency;
    }

    getContinuousMin(name, value) {
        return this.continuousMins[this.getVariableId(name)][value];
    }

    getContinuousMax(name, value) {
        return this.continuousMaxs[this.getVariableId(name)][value];
    }

    getContinuousBinVariableValue(bin, variableName, valueName) {
        return bin.variables[this.getVariableId(variableName)].getValue(valueName);
    }

    getContinuousBinVariableValueNormalised(bin, variableName, valueName) {
        return Utility.Normalised(this.getContinuousBinVariableValue(bin, variableName, valueName), this.getContinuousMin(variableName, valueName), this.getContinuousMax(variableName, valueName));
    }

    getCategoricalBinVariableCount(bin, variableName, category) {
        return bin.getVariable(this.getVariableId(variableName)).getCount(category);
    }

    getCategoricalBinVariableCategories(bin, variableName) {
        return bin.getVariable(this.getVariableId(variableName)).getCategories();
    }

    getCategoricalBinVariableValues(bin, variableName) {
        return bin.getVariable(this.getVariableId(variableName)).getValues();
    }

    getBinVariable(bin, variableName) {
        return bin.getVariable(this.getVariableId(variableName));
    }
    
    getBinPointsNormalised(bin) {
        return bin.pointCount / this.maxPoints;
    }

    getCategoricalVariables() {
        return this.getVariables().filter(v => v instanceof  CategoricalVariable);
    }

    getContinuousVariables() {
        return this.getVariables().filter(v => v instanceof  ContinuousVariable);
    }

    
}


class Variable {
    constructor(varId) {
        this.varId = varId;
    }

    getVarId() {
        return this.varId;
    }
}

class ContinuousVariable extends Variable {
    constructor(varId, min, max, mean, sd) {
        super(varId);
        this.min = min; 
        this.max = max;
        this.mean = mean;
        this.sd = sd;
    }

    static fromEntries(varId, entries) {
        return new ContinuousVariable(varId, Utility.Min(entries), Utility.Max(entries), Utility.Mean(entries), Utility.SD(entries));
    }

    transformProperties(variable, func) {
        this.min = func(this.min, variable.min);
        this.max = func(this.max, variable.max);
        this.mean = func(this.mean, variable.mean);
        this.sd = func(this.sd, variable.sd);
    }
    
    getValue(value) {
        return this[value];
    }
}

class CategoricalVariable extends Variable {
    constructor(varId, counts, sum) {
        super(varId);
        this.counts = counts;
        this.sum = sum;
    }

    static fromEntries(varId, entries) {
        var counts = {};
        for(let i=0; i<entries.length; i++) {
            counts[entries[i]] = (counts[entries[i]] || 0) + 1;
        }
        return new CategoricalVariable(varId, counts, entries.length);
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

    getNonZeroCategories() {
        return Object.keys(this.counts).filter(k => this.counts[k]);
    }
}

class Bin {
    constructor(binId, variableCount, pointCount) {
        this.binId = binId;
        this.pointCount = pointCount;
        this.variables = new Array(variableCount);
    }

    setVariable(varId, variable) {
        this.variables[varId] = variable;
    }

    getVariable(varId) {
        return this.variables[varId];
    }

    getPointCount() {
        return this.pointCount;
    }
}