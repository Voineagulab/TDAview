class event {
    constructor() {
        this.queue = {};
    }

    addEventListener(event, callback) {
        if(!this.queue[event]) {
            this.queue[event] = [];
        }
        this.queue[event].push(callback);
    }

    invokeEvent(event, ...args) {
        if(this.queue[event]) {
            this.queue[event].forEach(function (callback) {
                callback(...args);
            });
        }
    }
}