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

class Scalable2D extends Draggable2D {
    constructor(parent, handleSize = 5) {
        super();
        this.shouldScale = true;

        var quadgeom = new THREE.PlaneGeometry();
        var handlemat = new THREE.MeshBasicMaterial( {color: 0x000000, side: THREE.DoubleSide});
        handlemat.transparent = true;
        handlemat.opacity = 0.25;
        this.handles = new Array(4);
        for(let i=0; i<this.handles.length; i++) {
            this.handles[i] = new THREE.Mesh( quadgeom, handlemat);
            //parent.add(this.handles[i]);
        }

        this.background = new THREE.Mesh(quadgeom, new THREE.MeshBasicMaterial({color: 0xaaaaff, side: THREE.DoubleSide}));
        this.background.material.transparent = true;
        this.background.material.opacity = 0.25;
        //parent.add(this.background);

        //These handles need to be draggable2d to have good mouse interaction

        this.eventSystem.addEventListener("OnSelect", function(self) {
            self.background.visible = true;
            for(let i=0; i<self.handles.length; i++) {
                self.handles[i].visible = true;
            }
        });

        this.eventSystem.addEventListener("OnDeselect", function(self) {
            self.background.visible = false;
            for(let i=0; i<self.handles.length; i++) {
                self.handles[i].visible = false;
            }
        });
        
    }



    boundsWidth() {
        return undefined;
    }

    boundsHeight() {
        return undefined;
    }
}