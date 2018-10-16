class Draggable2D  {
    constructor() {
        this.eventSystem = new event();
        this.shouldSnap = false;
    }

    boundsContains(vector) {
        return false;
    }

    boundsCenter() {
        return undefined;
    }
}