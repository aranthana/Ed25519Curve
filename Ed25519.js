import { randomBytes } from 'crypto';
import BI from 'big-integer';

const _0n = BigInt(0);
const _1n = BigInt(1);
const _2n = BigInt(2);


const Ed25519 = Object.freeze({
    a: BigInt(-1),
    d: BigInt("37095705934669439343138083508754565189542113879843219016388785533085940283555"), // -121665 * pow(121666, -1, 2**255 - 19)
    gx: BigInt("15112221349535400772501151409588531511454012693041857206046113283949847762202"),
    gy: BigInt("46316835694926478169428394003475163141307993866256225615783033603165251855960"),
    gt: BigInt("46827403850823179245072216630277197565144205554125654976674165829533817101731"),
    m: BigInt("57896044618658097711785492504343953926634992332820282019728792003956564819949"),
    n: BigInt("7237005577332262213973186563042994240857116359379907606001950938285454250989"),
});


class Point {

    constructor(x, y, z, t) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.t = t;
    }

    static G = new Point(Ed25519.gx, Ed25519.gy, _1n, Ed25519.gt);

    // Using double and add algorithm.
    static multiply(point, num) {
        let newPoint = new Point(_0n, _1n, _1n, _0n);
        while (num > _0n) {
            if ((num & _1n) == (_1n)) {
                newPoint = Point.add(newPoint, point);
            }
            point = Point.double(point);
            num = num >> _1n;
        }
        return newPoint;
    }

    static double(point) {
        let A = mod(point.x * point.x);
        let B = mod(point.y * point.y);
        let C = mod(_2n * mod(point.z * point.z));
        let D = mod(Ed25519.a * A);
        let x1y1 = point.x + point.y;
        let E = mod(mod(x1y1 * x1y1) - A - B);
        let G = D + B;
        let F = G - C;
        let H = D - B;
        let X3 = mod(E * F);
        let Y3 = mod(G * H);
        let T3 = mod(E * H);
        let Z3 = mod(F * G);
        return new Point(X3, Y3, Z3, T3);
    }

    static add(point1, point2) {
        let A = mod((point1.y - point1.x) * (point2.y + point2.x));
        let B = mod((point1.y + point1.x) * (point2.y - point2.x));
        let F = mod(B - A);
        if (F == _0n) return Point.double(point1);
        let C = mod(point1.z * _2n * point2.t);
        let D = mod(point1.t * _2n * point2.z);
        let E = D + C;
        let G = B + A;
        let H = D - C;
        let X3 = mod(E * F);
        let Y3 = mod(G * H);
        let T3 = mod(E * H);
        let Z3 = mod(F * G);
        return new Point(X3, Y3, Z3, T3);
    }



}
let i = 0;
let start = Date.now();
while (i < 1000) {
    let r_b = randomBytes(32);
    let h_b = randomBytes(64);
    let priv_b = randomBytes(32);

    // Bytes to numbers.
    let priv = mod(BigInt(BI.fromArray(Array.from(priv_b), 256, false)));
    let r = mod(BigInt(BI.fromArray(Array.from(r_b), 256, false)));
    let h = mod(BigInt(BI.fromArray(Array.from(h_b), 256, false)));

    let R = Point.multiply(Point.G, r);
    let s = mod(r + (h * priv), Ed25519.n);
    let pub = Point.multiply(Point.G, priv);

    //Verifying
    let point1 = Point.multiply(Point.G, s);
    let point2 = Point.add(R, Point.multiply(pub, h));

    console.log(mod(point1.x * invert(point1.z)) == mod(point2.x * invert(point2.z)));
    i++;
}
let end = Date.now();
console.log(`Execution time: ${end - start} ms`);

function mod(a, b = Ed25519.m) {
    var res = a % b;
    return res >= _0n ? res : b + res;
}

function invert(number, modulo = Ed25519.m) {
    if (number === _0n || modulo <= _0n) {
        throw new Error(`invert: expected positive integers, got n=${number} mod=${modulo}`);
    }
    let a = mod(number, modulo);
    let b = modulo;
    // prettier-ignore
    let x = _0n, y = _1n, u = _1n, v = _0n;
    while (a !== _0n) {
        const q = b / a;
        const r = b % a;
        const m = x - u * q;
        const n = y - v * q;
        // prettier-ignore
        b = a, a = r, x = u, y = v, u = m, v = n;
    }
    const gcd = b;
    if (gcd !== _1n) throw new Error('invert: does not exist');
    return mod(x, modulo);
}

