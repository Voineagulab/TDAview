class DragSystem2D {
    constructor(element, renderer, camera) {
        var self = this;

        this.rects = [];

        this.hovering = undefined;
        this.hoverRect = undefined;
        this.hoverOffset = new THREE.Vector2();

        this.isMouseDown = false;
        this.mouseWorld = new THREE.Vector3();
        this.mouseScreen = new THREE.Vector3();

        this.eventSystem = new event();

        element.addEventListener("mousedown", function() {
            self.isMouseDown = true;
            if(self.hovering) {
                self.hovering.eventSystem.invokeEvent("OnDragStart", self.hovering, self.mouseWorld);
                self.hovering.eventSystem.invokeEvent("OnDrag", self.hovering, self.mouseWorld.add(self.hoverOffset));
            }
        });

        element.addEventListener("mousemove", function(e) {
            //Update mouse position
            var size = renderer.getSize();
            self.mouseScreen.x = (( e.clientX - 250 ) / size.width ) * 2 - 1;
            self.mouseScreen.y = - ( e.clientY / size.height ) * 2 + 1;

            if(self.isMouseDown && self.hovering) {
                self.mouseWorld.x = self.mouseScreen.x;
                self.mouseWorld.y = self.mouseScreen.y
                self.mouseWorld.unproject(self.hoverRect.camera);
                self.mouseWorld.z = 0;

                self.hovering.eventSystem.invokeEvent("OnDrag", self.hovering, self.mouseWorld.add(self.hoverOffset));
                self.eventSystem.invokeEvent("OnChange");
            } else {
                //Find new element
                for(let j=0; j<self.rects.length; j++) {
                    let rect = self.rects[j];
                    self.mouseWorld.x = self.mouseScreen.x;
                    self.mouseWorld.y = self.mouseScreen.y
                    self.mouseWorld.unproject(rect.camera);
                    self.mouseWorld.z = 0;

                    for(let i=0; i<rect.draggable.length; i++) {
                        if(rect.draggable[i].boundsContains(self.mouseWorld)) {
                            self.hovering = rect.draggable[i];
                            self.hoverOffset = self.hovering.boundsCenter().sub(self.mouseWorld);
                            self.hoverRect = rect;
                            return;
                        }
                    }
                    self.hovering = undefined;
                }
            }
        });

        element.addEventListener("mouseup", function() {
            if(self.isMouseDown && self.hovering) {
                self.hovering.eventSystem.invokeEvent("OnDragEnd", self.hovering, self.mouseWorld);
            }
            self.isMouseDown = false;
        });
    }

    addRect(rect) {
        
        console.log(this);
        this.rects.push(rect);
    }
}

class DragRect2D {
    constructor(camera) {
        this.camera = camera;
        this.draggable = [];
    }

    addDraggable(items) {
        this.draggable.push(...items);
    }
}