class InteractSet {
    constructor(draggable, isDraggable, isSelectable) {
        this.draggable = draggable;
        this.isDraggable = isDraggable;
        this.isSelectable = isSelectable;
    }

    //Overwrite these functions
    ObjectContainsPoint(object, position) {
        return false;
    }

    //Only applicable if isDraggable is true
    ObjectDragCenter(object, center) {
        return undefined;
    }

    OnObjectSelect(object) {
        return;
    }

    OnObjectDeselect(object) {
        return;
    }

    OnObjectDragStart(object) {
        return;
    }

    OnObjectDrag(object) {
        return;
    }

    OnObjectDragEnd(object) {
        return;
    }

    
}