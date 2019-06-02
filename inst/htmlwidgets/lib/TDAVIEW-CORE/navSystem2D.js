/*
Public Events: OnChange
*/
const zoomTime = 0.05;

class NavSystem2D {
    constructor(element, renderer, camera) {
        var self = this;

        this.camera = camera;

        this.rects = [];

        this.hovering = undefined;
        this.hoverRect = undefined;

        this.hoverOffset = new THREE.Vector2();

        this.isMouseDown = false;
        this.mouseWorld = new THREE.Vector3();
        this.mouseScreen = new THREE.Vector2();

        this.dragStart = new THREE.Vector2();
        this.dragging = false;

        this.selected = undefined;

        this.eventSystem = new event();
        
        //Zoom camera smoothly in response to wheel
        this.zoomStart = undefined;
        this.zoomTarget = undefined;
        this.zoomClock = new THREE.Clock(false);
        this.cameraOffset = new THREE.Vector2();
        this.panStart = new THREE.Vector2();
        element.addEventListener("wheel", function(e) {
            if(!e.ctrlKey) {
                if(!self.zoomClock.running) {
                    self.zoomTarget = self.camera.zoom;
                }
                self.zoomStart = self.camera.zoom
                self.zoomClock.start();
                self.zoomTarget = Math.max(0.1, self.zoomTarget - (e.deltaY > 0 ? 1 : -1) * 0.1 * camera.zoom);
            }
        });

        element.addEventListener("mousedown", function() {
            self.isMouseDown = true;
            self.dragStart.copy(self.mouseScreen);

            if(!self.hovering) {
                self.panStart.x = self.camera.position.x;
                self.panStart.y = self.camera.position.y;
            }
        });

        element.addEventListener("mousemove", function(e) {
            //Update mouse position
            var size = renderer.getSize();
            self.mouseScreen.x = (( e.clientX - 250 ) / size.width ) * 2 - 1;
            self.mouseScreen.y = - ( e.clientY / size.height ) * 2 + 1;

            if(self.isMouseDown) {
                if(self.dragging || self.mouseScreen.distanceTo(self.dragStart) >= 0.005) {
                    if(!self.dragging) {
                        self.dragging = true;
                        if(self.hovering) {
                            self.hovering.eventSystem.invokeEvent("OnDragStart", self.hovering, self.mouseWorld);
                        }
                    }

                    self.mouseWorld.x = self.mouseScreen.x;
                    self.mouseWorld.y = self.mouseScreen.y

                    if(self.hovering) {
                        //Drag element
                        self.mouseWorld.z = 0;
                        self.mouseWorld.unproject(self.hoverRect.camera);
                        self.mouseWorld.z = 0;
                        
                        self.hovering.eventSystem.invokeEvent("OnDrag", self.hovering, self.mouseWorld.add(self.hoverOffset));
                        let center = self.hovering.boundsCenter();
                        //self.hoverRect.setGraphicPosition(center.x, center.y);
                        self.eventSystem.invokeEvent("OnChange");
                    } else {
                        //Pan camera (need world drag start to avoid feedback)
                        self.mouseWorld.x -= self.dragStart.x;
                        self.mouseWorld.y -= self.dragStart.y;
                        self.mouseWorld.unproject(self.camera);
                        self.mouseWorld.sub(self.camera.position);
                        self.mouseWorld.x -= self.panStart.x;
                        self.mouseWorld.y -= self.panStart.y;
                        self.mouseWorld.z = 0;
                        self.camera.position.setX(-self.mouseWorld.x);
                        self.camera.position.setY(-self.mouseWorld.y);
                    }
                    self.eventSystem.invokeEvent("OnChange");
                }
            } else {
                //Find new element
                for(let j=0; j<self.rects.length; j++) {
                    let rect = self.rects[j];
                    self.mouseWorld.x = self.mouseScreen.x;
                    self.mouseWorld.y = self.mouseScreen.y
                    self.mouseWorld.unproject(rect.camera);
                    self.mouseWorld.z = 0;

                    for(let i=0; i<rect.draggable.length; i++) {
                        if(rect.draggable[i].boundsContains.call(rect.draggable[i], self.mouseWorld)) {
                            let center = rect.draggable[i].boundsCenter();
                            
                            if(self.hovering !== rect.draggable[i]) {
                                self.hovering = rect.draggable[i];
                                self.hoverRect = rect;

                                //Resize and display rect graphic
                                //if(self.hovering.shouldScale) {
                                    //rect.setGraphicPosition(center.x, center.y);
                                    //rect.setGraphicScale(self.hovering.boundsWidth(), self.hovering.boundsHeight());
                                    //rect.setGraphicVisibility(true);
                                    //self.eventSystem.invokeEvent("OnChange");
                                //}
                            }
                            self.hoverOffset = center.sub(self.mouseWorld);
                            return;
                        }
                    }
                    self.hovering = undefined;
                    //rect.setGraphicVisibility(false);
                    self.eventSystem.invokeEvent("OnChange");
                }
            }
        });

        element.addEventListener("mouseup", function() {
            if(self.dragging) {
                if(self.hovering) {
                    self.hovering.eventSystem.invokeEvent("OnDragEnd", self.hovering, self.mouseWorld);
                }
                self.dragging = false;
            } else {
                if(self.selected && self.hovering != self.selected) {
                    self.selected.eventSystem.invokeEvent("OnDeselect", self.selected);
                    self.eventSystem.invokeEvent("OnChange");
                }

                if(self.hovering) {
                    self.selected = self.hovering;
                    self.selected.eventSystem.invokeEvent("OnSelect", self.selected);
                    self.eventSystem.invokeEvent("OnChange");
                }
            }
            self.isMouseDown = false;
        });
    }

    addRect(rect) {
        this.rects.push(rect);
    }

    animate() {
        if(this.zoomClock.running) {
            if(this.zoomClock.elapsedTime > zoomTime) {
                this.zoomClock.stop();
            } else {
                let t = Math.min(this.zoomClock.getElapsedTime()/zoomTime, 1);
                this.camera.zoom = THREE.Math.lerp(this.zoomStart, this.zoomTarget, t);
                this.camera.updateProjectionMatrix()
                return true;
            }
        }
        return false;
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