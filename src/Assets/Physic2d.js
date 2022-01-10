import { Matrix, Vector } from "./Math";

export const TYPE = {
    MASS: 0,
    CIRCLE: 1,
    FIXEDRECT: 3,
}

Vector.prototype.rot = function(angle) {
    let cos = Math.cos(angle);
    let sin = Math.sin(angle);
    return this.linearTransform(new Matrix(2, 2, cos, -sin, sin, cos));
}

Vector.prototype.angle = function() {
    return Math.atan2(this.components[1], this.components[0]);
}

Vector.prototype.proj = function(v) {
    let x = v.components[0];
    let y = v.components[1];
    return this.linearTransform(new Matrix(2, 2, x*x, x*y, x*y, y*y)).mul(1 / (x*x + y*y));
}

Vector.prototype.projSize = function(v) {
    return Vector.innerProd(this, v) / v.size();
}

export class Dot {
    static dotCnt = 0;
    constructor(x, y) {
        this.id = Dot.dotCnt++;
        this.p = new Vector(x, y);
    }
}

export class FixedRectangle extends Dot {
    constructor(x, y, w, h, angle) {
        super(x, y);
        this.type = TYPE.FIXEDRECT;
        this.movable = false;
        this.w = w;
        this.h = h;
        this.angle = angle;
        this.sin = Math.sin(angle);
        this.cos = Math.cos(angle);

        let v1 = new Vector(w * this.cos, w * this.sin);
        let v2 = new Vector(-h * this.sin, h * this.cos);
        this.vertices = [
            this.p, 
            this.p.copy().add(v1), 
            this.p.copy().add(v1).add(v2), 
            this.p.copy().add(v2)
        ];

        this.minX = x;
        this.minY = y;
        this.maxX = x;
        this.maxY = y;
        this.vertices.forEach(vertex => {
            this.minX = Math.min(this.minX, vertex.components[0]);
            this.minY = Math.min(this.minY, vertex.components[1]);
            this.maxX = Math.max(this.maxX, vertex.components[0]);
            this.maxY = Math.max(this.maxY, vertex.components[1]);
        });
    }
}

export class Mass extends Dot {
    constructor(x, y, vx, vy, m) {
        super(x, y);
        this.type = TYPE.MASS;
        this.movable = true;
        this.v = new Vector(vx, vy);
        this.a = new Vector(0, 0);
        this.m = m;
    }

    force(f) {
        this.a.add(f, 1 / this.m);
    }

    move(dt) {
        this.v.add(this.a, dt);
        this.p.add(this.v, dt);
        this.a.init(2);
    }

    momentum() {
        return this.m * this.v.size();
    }
}

export class Circle extends Mass {
    constructor(x, y, vx, vy, m, radius, k) {
        super(x, y, vx, vy, m);
        this.type = TYPE.CIRCLE;
        this.radius = radius;
        if(!!k) this.k = k;
        this.updateHitbox()
    }

    updateHitbox() {
        this.minX = this.p.components[0] - this.radius;
        this.minY = this.p.components[1] - this.radius;
        this.maxX = this.p.components[0] + this.radius;
        this.maxY = this.p.components[1] + this.radius;
    }

    move(dt) {
        super.move(dt);
        this.updateHitbox();
    }
}

export class System {
    constructor(g) {
        this.g = g;
        this.objects = [];
    }

    static intervalDist(min1, max1, min2, max2) {
        if(min1 < min2) {
            return min2 - max1;
        } else {
            return min1 - max2;
        }
    }

    addObject(obj) {
        this.objects.push(obj);
    }

    gravityAll() {
        this.objects.filter(obj => obj.movable).forEach(obj => {
            obj.force(new Vector(0, -obj.m * this.g));
        });
    }

    moveAll(dt) {
        this.objects.filter(obj => obj.movable).forEach(obj => {
            obj.move(dt);
        });
    }

    collisionAll() {
        for(let i=0; i<this.objects.length; i++) {
            for(let j=i+1; j<this.objects.length; j++) {
                this.collision(this.objects[i], this.objects[j]);
            }
        }
    }

    totalEnergy() {
        let result = 0;
        this.objects.filter(obj => obj.movable).forEach(obj => {
            result += (0.5 * obj.m * obj.v.sizeSqr()) + obj.m * this.g * obj.p.components[1];
        });
        return result;
    }

    CircleCircleCollision(circ1, circ2) {
        let dist = Vector.dist(circ1.p, circ2.p);
        let stableDist = circ1.radius + circ2.radius;
        if(dist > stableDist) {
            return;
        }
        let k = (circ1.k + circ2.k) / 2;
        let force = Vector.sub(circ2.p, circ1.p).mul(k * (dist - stableDist) / dist);
        circ1.force(force);
        circ2.force(force.mul(-1));
    }

    CircleFixedRectCollision(circ, rect) {
        let minDistSqr = 999999999;
        let closeVertex;
        rect.vertices.forEach(vertex => {
            let distSqr = Vector.distSqr(circ.p, vertex);
            if(distSqr < minDistSqr) {
                minDistSqr = distSqr;
                closeVertex = vertex;
            }
        });
        let prjVecs = [
            Vector.sub(closeVertex, circ.p).dir(),
            new Vector(rect.cos, rect.sin),
            new Vector(-rect.sin, rect.cos),
        ];
        let minOverlap = 999999999;
        let force;
        for(let i=0; i<prjVecs.length; i++) {
            let prjVec = prjVecs[i];
            let prj1 = Vector.innerProd(circ.p, prjVec);
            let min1 = prj1 - circ.radius;
            let max1 = prj1 + circ.radius;
            let min2 = 999999999;
            let max2 = -999999999;
            rect.vertices.forEach(vertex => {
                let prj2 = Vector.innerProd(vertex, prjVec);
                if(prj2 < min2) min2 = prj2;
                if(max2 < prj2) max2 = prj2;
            });
            let gap = System.intervalDist(min1, max1, min2, max2);
            if(gap > 0) {
                return;
            }
            if(-gap < minOverlap) {
                minOverlap = -gap;
                if(min1 < min2) {
                    force = prjVec.mul(-minOverlap * circ.k);
                } else {
                    force = prjVec.mul(minOverlap * circ.k);
                }
            }
        }
        circ.force(force);
    }

    collision(obj1, obj2) {
        if(System.intervalDist(obj1.minX, obj1.maxX, obj2.minX, obj2.maxX) > 0) {
            return;
        }
        if(System.intervalDist(obj1.minY, obj1.maxY, obj2.minY, obj2.maxY) > 0) {
            return;
        }

        if(obj1.type === TYPE.CIRCLE && obj2.type === TYPE.CIRCLE) {
            this.CircleCircleCollision(obj1, obj2);
        }
        if(obj1.type === TYPE.CIRCLE && obj2.type === TYPE.FIXEDRECT) {
            this.CircleFixedRectCollision(obj1, obj2);
        }
        if(obj1.type === TYPE.FIXEDRECT && obj2.type === TYPE.CIRCLE) {
            this.CircleFixedRectCollision(obj2, obj1);
        }
    }
}