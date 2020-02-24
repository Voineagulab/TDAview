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
