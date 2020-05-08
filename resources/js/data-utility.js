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
            mean += (array[i] * 1);
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
