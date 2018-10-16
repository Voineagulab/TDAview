class Draggable2D  {
    constructor() {
        this.eventSystem = new event();
    }

    boundsContains(vector) {
        return false;
    }

    boundsCenter() {
        return undefined;
    }
}