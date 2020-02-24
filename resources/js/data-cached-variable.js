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
