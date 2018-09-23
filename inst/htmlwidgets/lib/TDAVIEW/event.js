class event {
    constructor() {
        this.queue = {};
    }

    addEventListener(event, callback, object = undefined) {
        if(!this.queue[event]) {
            this.queue[event] = [];
        }
        this.queue[event].push(callback.bind(object));
    }

    invokeEvent(event, ...args) {
        if(this.queue[event]) {
            this.queue[event].forEach(function (callback) {
                callback(...args);
            });
        }
    }
}