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
