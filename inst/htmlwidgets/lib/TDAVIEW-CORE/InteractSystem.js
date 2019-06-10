class InteractSystem {
    constructor(element, camera, width, height) {
        var self = this;

        this.camera = camera;
        this.element = element;

        this.resize(width, height);
        
        this.mouseScreen = new THREE.Vector2();
        this.mouseWorld = new THREE.Vector3();
        this.mouseScreenDown = new THREE.Vector2();
        this.mouseWorldOffset = new THREE.Vector2();

        this.cameraPositionDown = new THREE.Vector2();

        this.interactSets = [];

        this.currentObject = undefined;
        this.currentSet = undefined;

        this.selectObject = undefined;
        this.selectSet = undefined;

        this.isMouseDown = false;
        this.isDragging = false;

        this.eventSystem = new event();
        
        element.addEventListener("mousedown", function() {
            self.isMouseDown = true;
            self.mouseScreenDown.copy(self.mouseScreen);
            self._updateMouseWorld();
            self._updateObjectSetAtMouseWorld();

            if(self.currentSet) {
                if(self.currentSet.isDraggable) {
                    self.mouseWorldOffset = self.currentSet.ObjectDragCenter(self.currentObject, self.mouseWorldOffset).sub(self.mouseWorld);
                }
            } else {
                self.cameraPositionDown.x = self.camera.position.x;
                self.cameraPositionDown.y = self.camera.position.y;
            }
        });

        element.addEventListener("mousemove", function(e) {
            self._updateMouseScreen(e.clientX, e.clientY);

            if(self.isMouseDown) {
                if(self.isDragging || self.mouseScreen.distanceTo(self.mouseScreenDown) >= 0.005) {
                    if(!self.isDragging) {
                        self.isDragging = true;
                        if(self.currentObject) {
                            self.currentSet.OnObjectDragStart(self.currentObject);
                        }
                    }

                    if(self.currentSet) {
                        if(self.currentSet.isDraggable) {
                            self._updateMouseWorld();
                            self.currentSet.OnObjectDrag(self.currentObject, self.mouseWorld.add(self.mouseWorldOffset));
                        }
                    } else {
                        self.mouseScreen.sub(self.mouseScreenDown);
                        self._updateMouseWorld();

                        self.camera.position.setX(-(self.mouseWorld.x - self.cameraPositionDown.x - self.camera.position.x));
                        self.camera.position.setY(-(self.mouseWorld.y - self.cameraPositionDown.y - self.camera.position.y));
                        self.OnCameraPan();
                    }
                }
            }
        });

        element.addEventListener("mouseup", function() {
            if(self.isDragging) {
                if(self.currentObject) {
                    self.currentSet.OnObjectDragEnd(self.currentObject);
                }
                self.isDragging = false;
            } else {
                self._updateMouseWorld();
                self._updateObjectSetAtMouseWorld();

                if(self.selectObject && self.selectObject != self.currentObject) {
                    self.selectSet.OnObjectDeselect(self.selectObject);
                }

                if(self.currentObject && self.currentSet.isSelectable) {
                    self.selectObject = self.currentObject;
                    self.selectSet = self.currentSet;
                    self.currentSet.OnObjectSelect(self.selectObject);
                }
            }
            self.isMouseDown = false;
        });
    }

    _updateMouseScreen(clientX, clientY) {
        this.mouseScreen.x = (( clientX - this.rect.left ) / this.width ) * 2 - 1;
        this.mouseScreen.y = -(( clientY - this.rect.top) / this.height ) * 2 + 1;
    }

    _updateMouseWorld() {
        this.mouseWorld.x = this.mouseScreen.x;
        this.mouseWorld.y = this.mouseScreen.y;
        this.mouseWorld.z = 0;
        this.mouseWorld.unproject(this.camera);
        this.mouseWorld.z = 0;
    }

    _updateObjectSetAtMouseWorld() {
        for(let j=0; j<this.interactSets.length; j++) {
            let set = this.interactSets[j];
            for(let i=0; i<set.draggable.length; i++) {
                if(set.ObjectContainsPoint(set.draggable[i], this.mouseWorld)) {
                    this.currentObject = set.draggable[i];
                    this.currentSet = set;
                    return;
                }
            }
        }
        this.currentObject = undefined;
        this.currentSet = undefined;
    }

    resize(width, height) {
        this.width = width;
        this.height = height;
        this.rect = this.element.getBoundingClientRect();
    }

    addInteractSet(set) {
        this.interactSets.push(set);
    }

    OnCameraPan() {
        return
    }
}