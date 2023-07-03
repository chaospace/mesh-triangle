import { PointArray } from "../types";

class Node {
    x: number;
    y: number;
    id?: number;
    constructor(x: number, y: number, id = undefined) {
        this.x = x;
        this.y = y;
        this.id = id && !isNaN(id!) && isFinite(id!) ? id : undefined;
    }

    eq(p: Node) {
        let dx = this.x - p.x;
        let dy = this.y - p.y;
        return Math.abs(dx) < .0001 && Math.abs(dy) < .0001;
    }

    toString() {
        return `(x : ${this.x}, y: ${this.y})`;
    }
}


class Edge {
    nodes: Node[];
    constructor(p0: Node, p1: Node) {
        this.nodes = [p0, p1];
    }

    eq(edge: Edge) {
        let na = this.nodes;
        let nb = edge.nodes;
        let na0 = na[0];
        let na1 = na[1];
        let nb0 = nb[0];
        let nb1 = nb[1];
        return (na0.eq(nb0) && na1.eq(nb1)) || (na0.eq(nb1) && na1.eq(nb0));
    }
}

class Triangle {
    nodes: Node[];
    edges: Edge[];
    id?: number;
    circle: { x: number, y: number, radiusSq: number };
    constructor(p0: Node, p1: Node, p2: Node) {
        this.nodes = [p0, p1, p2];
        this.edges = [new Edge(p0, p1), new Edge(p1, p2), new Edge(p2, p0)];

        /**
        function circumcircle([[x1, y1], [x2, y2], [x3, y3]]) {
            const a2 = x1 - x2; // 가로 거리 차
            const a3 = x1 - x3; // 가로 거리 차
            const b2 = y1 - y2; // 세로 거리 차
            const b3 = y1 - y3; // 세로 거리 차
            const d1 = x1 * x1 + y1 * y1;
            const d2 = d1 - x2 * x2 - y2 * y2;
            const d3 = d1 - x3 * x3 - y3 * y3;
            const ab = (a3 * b2 - a2 * b3) * 2;
            const xa = (b2 * d3 - b3 * d2) / ab - x1;
            const ya = (a3 * d2 - a2 * d3) / ab - y1;
            if (isNaN(xa) || isNaN(ya)) return;
            return {x: x1 + xa, y: y1 + ya, r: Math.sqrt(xa * xa + ya * ya)};
        } 
         */
        // 외접원 정보 구성
        this.circle = { x: 0, y: 0, radiusSq: 0 };
        let ax = p1.x - p0.x;
        let ay = p1.y - p0.y;
        let bx = p2.x - p0.x;
        let by = p2.y - p0.y;

        let t = (p1.x ** 2 - p0.x ** 2 + p1.y ** 2 - p0.y ** 2);// p1, p0 거리
        let u = (p2.x ** 2 - p0.x ** 2 + p2.y ** 2 - p0.y ** 2);// p2, p0 거리
        let s = 1 / (2 * (ax * by - ay * bx));
        this.circle.x = ((p2.y - p0.y) * t + (p0.y - p1.y) * u) * s;
        this.circle.y = ((p0.x - p2.x) * t + (p1.x - p0.x) * u) * s;

        let dx = p0.x - this.circle.x;
        let dy = p0.y - this.circle.y;
        this.circle.radiusSq = dx ** 2 + dy ** 2;

    }
}



class Delaunay {
    _width: number;
    _height: number;
    _triangles: Triangle[];
    constructor(width: number, height: number) {
        this._width = width;
        this._height = height;
        this._triangles = [];
        this.clear();
    }

    clear() {
        let p0 = new Node(1, 1);
        let p1 = new Node(this._width - 1, 1);
        let p2 = new Node(this._width - 1, this._height - 1);
        let p3 = new Node(1, this._height - 1);
        this._triangles = [
            new Triangle(p0, p1, p2),
            new Triangle(p0, p2, p3)
        ];
    }

    insert(points: PointArray) {

        for (let k = 0, klen = points.length; k < klen; k++) {
            const point = points[k];
            let temps = [];
            let edges = [];
            let triangles = this._triangles;
            for (let ilen = triangles.length, i = 0; i < ilen; i++) {
                let t = triangles[i];
                let dx = t.circle.x - point.x;
                let dy = t.circle.y - point.y;
                let distSq = dx ** 2 + dy ** 2;
                //추가할 포인트 위치가 현재 외접원 안에 있다면 엣지추가
                if (distSq < t.circle.radiusSq) {
                    edges.push(t.edges[0], t.edges[1], t.edges[2]);
                } else { // 기존 삼각형 유지
                    temps.push(t);
                }
            }

            let polygons: Edge[] = [];

            edgesLoop: for (let ilen = edges.length, i = 0; i < ilen; i++) {
                let edge = edges[i];
                for (let jlen = polygons.length, j = 0; j < jlen; j++) {
                    if (edge.eq(polygons[j])) {
                        polygons.splice(j, 1);
                        continue edgesLoop;
                    }
                }
                polygons.push(edge);
            }

            for (let ilen = polygons.length, i = 0; i < ilen; i++) {
                let edge = polygons[i];
                temps.push(
                    new Triangle(edge.nodes[0], edge.nodes[1], new Node(point.x, point.y))
                );
            }
            this._triangles = temps;
        }
        return this;
    }

    getTriangles() {
        return this._triangles;
    }

    static from(w: number, h: number) {
        return new Delaunay(w, h);
    }
}

export type { Triangle }
export default Delaunay;