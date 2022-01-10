export class Matrix {
    constructor(n, m) {
        this.n = n;
        this.m = m;
        this.entries = Array.prototype.slice.call(arguments, 2);
    }

    entry(i, j) {
        return this.entries[i * this.m + j];
    }
}

export class Vector {
    constructor() {
        this.init(...arguments);
    }

    static innerProd(v1, v2) {
        if(v1.dimension() !== v2.dimension()) {
            return new Error("diff vector dimension");
        }
        let result = 0;
        for(let i=0; i<v1.dimension(); i++) {
            result += v1.components[i] * v2.components[i];
        }
        return result;
    }

    static distSqr(v1, v2) {
        if(v1.dimension() !== v2.dimension()) {
            return new Error("diff vector dimension");
        }
        let result = 0;
        for(let i=0; i<v1.dimension(); i++) {
            result += Math.pow(v1.components[i] - v2.components[i], 2);
        }
        return result;
    }

    static dist(v1, v2) {
        return Math.sqrt(Vector.distSqr(v1, v2));
    }

    static sub(v1, v2) {
        let result = v1.copy();
        result.add(v2, -1);
        return result;
    }

    copy() {
        return new Vector(...this.components);
    }

    dimension() {
        return this.components.length;
    }

    init() {
        if(arguments.length === 1) {
            this.components = [];
            for(let i=0; i<arguments[0]; i++) {
                this.components.push(0);
            }
        } else {
            this.components = [...arguments];
        }
        return this;
    }

    add(v, c) {
        if(this.dimension() !== v.dimension()) {
            return new Error("diff vector dimension");
        }
        if(!!c) {
            for(let i=0; i<this.dimension(); i++) {
                this.components[i] += c * v.components[i];
            }
        }
        else {
            for(let i=0; i<this.dimension(); i++) {
                this.components[i] += v.components[i];
            }
        }
        return this;
    }

    mul(c) {
        for(let i=0; i<this.dimension(); i++) {
            this.components[i] *= c;
        }
        return this;
    }

    sizeSqr() {
        let result = 0;
        for(let i=0; i<this.dimension(); i++) {
            result += Math.pow(this.components[i], 2);
        }
        return result;
    }

    size() {
        return Math.sqrt(this.sizeSqr());
    }

    dir() {
        return this.mul(1 / this.size());
    }

    linearTransform(mat) {
        if(mat.m !== this.dimension()) {
            return new Error("diff vector dimension");
        }
        let result = [];
        for(let i=0; i<mat.n; i++) {
            result.push(0);
            for(let j=0; j<mat.m; j++) {
                result[i] += mat.entry(i, j) * this.components[j];
            }
        }
        this.components = result;
        return this;
    }
}