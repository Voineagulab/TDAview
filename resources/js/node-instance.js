class NodeInstance {
    constructor(id, data) {
        this.id = id;
        this.userData = data;
        this.color = 0.0;
        this.width = this.height = 1.0;
        this.x = this.y = 0;
        this.fixed = false;
        this.neighbors = [];
    }

    addNeighbor(node) {
        this.neighbors.push(node);
    }

    countNeighbors() {
        return this.neighbors.length;
    }

    getPosition() {
        return new THREE.Vector3(this.x, this.y, 0);
    }

    setColor(value) {
        this.color = value;
    }

    getColor() {
        return this.color;
    }

    setRadius(value) {
        this.width = this.height = value;
    }

    getRadius() {
        return this.width;
    }

    containsPoint(position) {
        let targ = this.getPosition();
        let r = this.width;

        //Check if inside bounding box;
        if(position.x >= targ.x - r &&
            position.x <= targ.x + r &&
            position.y >= targ.y - r &&
            position.y <= targ.y + r) {
            //Check if inside circle

            if(Math.pow(position.x - targ.x, 2) + Math.pow(position.y - targ.y, 2) <= r*r) {
                return true;
            }
        }
        return false;
    }
}
