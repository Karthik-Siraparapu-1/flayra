/**
 * Advanced Spatial Partitioning (Elite DSA)
 * Provides high-performance geographic discovery using Quadtrees.
 */

class Point {
    constructor(x, y, data) {
        this.x = x; // longitude
        this.y = y; // latitude
        this.userData = data; // UserID, Name, etc.
    }
}

class Boundary {
    constructor(x, y, w, h) {
        this.x = x; // center x (longitude)
        this.y = y; // center y (latitude)
        this.w = w; // half-width
        this.h = h; // half-height
    }

    contains(point) {
        return (
            point.x >= this.x - this.w &&
            point.x <= this.x + this.w &&
            point.y >= this.y - this.h &&
            point.y <= this.y + this.h
        );
    }

    intersects(range) {
        return !(
            range.x - range.w > this.x + this.w ||
            range.x + range.w < this.x - this.w ||
            range.y - range.h > this.y + this.h ||
            range.y + range.h < this.y - this.h
        );
    }
}

class Quadtree {
    constructor(boundary, capacity) {
        this.boundary = boundary;
        this.capacity = capacity;
        this.points = [];
        this.divided = false;
    }

    subdivide() {
        const { x, y, w, h } = this.boundary;
        const nw = new Boundary(x - w / 2, y + h / 2, w / 2, h / 2);
        this.northwest = new Quadtree(nw, this.capacity);
        const ne = new Boundary(x + w / 2, y + h / 2, w / 2, h / 2);
        this.northeast = new Quadtree(ne, this.capacity);
        const sw = new Boundary(x - w / 2, y - h / 2, w / 2, h / 2);
        this.southwest = new Quadtree(sw, this.capacity);
        const se = new Boundary(x + w / 2, y - h / 2, w / 2, h / 2);
        this.southeast = new Quadtree(se, this.capacity);
        this.divided = true;
    }

    insert(point) {
        if (!this.boundary.contains(point)) return false;

        if (this.points.length < this.capacity) {
            this.points.push(point);
            return true;
        }

        if (!this.divided) this.subdivide();

        return (
            this.northwest.insert(point) ||
            this.northeast.insert(point) ||
            this.southwest.insert(point) ||
            this.southeast.insert(point)
        );
    }

    query(range, found = []) {
        if (!this.boundary.intersects(range)) return found;

        for (const p of this.points) {
            if (range.contains(p)) found.push(p);
        }

        if (this.divided) {
            this.northwest.query(range, found);
            this.northeast.query(range, found);
            this.southwest.query(range, found);
            this.southeast.query(range, found);
        }

        return found;
    }
}

// Global Singleton for Campus (Example: Center of MU University)
// Flayra Center: [70.8354, 22.3854] 
const CampusBoundary = new Boundary(70.8, 22.3, 10.0, 10.0); // Large bounding box for university map
let campusQT = new Quadtree(CampusBoundary, 10);

exports.insertUser = (userId, lng, lat, userData) => {
    return campusQT.insert(new Point(lng, lat, { userId, ...userData }));
};

exports.queryNearby = (lng, lat, radiusLng, radiusLat) => {
    const range = new Boundary(lng, lat, radiusLng, radiusLat);
    return campusQT.query(range);
};

exports.rebuildTree = (users) => {
    campusQT = new Quadtree(CampusBoundary, 10);
    users.forEach(u => {
        if (u.location && u.location.coordinates) {
          this.insertUser(u._id, u.location.coordinates[0], u.location.coordinates[1], { firstName: u.firstName, age: u.age });
        }
    });
    console.log(`[SPATIAL] Quadtree Rebuilt with ${users.length} students.`);
};
