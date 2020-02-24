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
