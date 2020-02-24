const DATA_TYPE_NUMBER = 1;
const DATA_TYPE_CATEGORY = 2;
const DATA_TYPE_ID = 3;
const DATA_TYPE_DATE = 4;

class Data {
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
