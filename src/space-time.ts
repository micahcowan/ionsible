/**
 * This module provides type-safe facilities for representing
 * timestamps, durations of time, and positions and velocities in 2d
 * space.
 */

/**
 * Represents a moment in time. Wraps the builtin Date class.
 */
export class Timestamp {
    private _stamp : number;

    /**
     * Constructs a new Timestamp, given either a Date object or another
     * Timestamp.
     *
     * If no argument is provided, defaults to the current time.
     */
    constructor(stampIn : Date | Timestamp = new Date) {
        if (stampIn instanceof Timestamp) {
            // We were passed a Timestamp; resolve to underlying ms count.
            this._stamp = stampIn._stamp;
        }
        else {
            // We were passed a Date; resolve to an ms count.
            this._stamp = stampIn.valueOf();
        }
    }

    /**
     * subtracts a timestamp `t` from this one, producing a Duration
     * result.
     */
    sub(t : Timestamp) : Duration {
        return new Duration(this._stamp - t._stamp);
    }
}

/**
 * Represents a duration of time.
 */
export class Duration {
    private _ms : number;

    /**
     * Constructs a Duration, given either another Duration, or a
     * number of milliseconds.
     *
     * The number form of argument is intended for use by `Timestamp`'s
     * `.sub()` method only. (Typescript doesn't currently provide a
     * means of enforcing that.)
     */
    constructor(ms : Duration | number) {
        if (ms instanceof Duration) {
            // We were passed a Duration; resolve to underlying ms.
            this._ms = ms._ms;
        }
        else {
            this._ms = ms;
        }
    }

    /**
     * return the duration in seconds.
     *     dur.s
     */
    get s() : number {
        return this._ms / 1000;
    }

    /**
     * return the duration in milliseconds.
     *     dur.ms
     */
    get ms() : number {
        return this._ms;
    }
}

/**
 * Any type with an x and a y component.
 * Point, Velocity, and Acceleration implement this.
 * Only used internally - but has to be exported because generic classes
 * that use it are exported.
 */
export interface BasicXY {
    x : number;
    y : number;
}

/**
 * A generic type providing the common definition for
 * the Point, Velocity, and Acceleration classes,
 * allowing a Point to be advanced by a Velocity over time (Duration),
 * or a Celocity to be advanced by an Acceleration over time.
 * If a third derivative is called for (unlikely?), an Acceleration is
 * advanced by any unspecified BasicXY (this allows advancing an
 * Acceleration by a Point or Velocity, but this is not encouraged).
 *
 * The intention is to force separation between a Position over time,
 * and its derivatives (Velocity, Acceleration), requiring time
 * (Duration) to be involved at each step.
 */
export class DerivablePoint<D extends BasicXY> {
    private readonly _x : number;
    private readonly _y : number;
    constructor(x : number, y? : number);
    constructor(dm : DirMag);
    constructor(x : any, y? : number) {
        if (x === undefined || typeof x == "number") {
            this._x = x === undefined? 0 : x;
            this._y = y === undefined? 0 : y;
        }
        else {
            let dm = x;
            this._x = dm.mag * Math.cos(dm.dir)
            this._y = dm.mag * Math.sin(dm.dir)
        }
    }
    /** Return a copy of this Point, Velocity, or Acceleration. */
    clone() : DerivablePoint<D> {
        return new DerivablePoint<D>(this._x, this._y);
    }
    get x() : number {
        return this._x;
    }
    get y() : number {
        return this._y;
    }
    /**
     * Advance by an amount, adjusted by the amount of time that's
     * passed, and return the result (does not modify this).
     *
     * If we're a Point, advances according to Velocity.
     * If we're a Velocity, advances according to Acceleration.
     */
    advanced(v : D, t : Duration) : DerivablePoint<D> {
        return new DerivablePoint<D>(
            this._x + (v.x * t.s)
          , this._y + (v.y * t.s)
        );
    }

    /**
     * Rotate on the origin by the specified amount (in radians), and
     * return (does not modify this object).
     */
    rotated(r : number) : DerivablePoint<D> {
        return new DerivablePoint<D>(
            this.x * Math.cos(r) + this.y * -Math.sin(r)
          , this.x * Math.sin(r) + this.y * Math.cos(r)
        );
    }

    /**
     * Return an equivalent to this thing, as a DirMag (direction +
     * magnitude).
     */
    asDirMag() : DirMag {
        return {
            dir: Math.atan2(this.y, this.x)
          , mag: (new DerivablePoint<D>(0, 0)).distFrom(this)
        };
    }

    /**
     * Returns the magnitude of this vector, as measured in a particular direction.
     * @param dir  the direction to measure in, expressed in radians
     */
    magnitudeInDir(dir: number) : number {
        // First, "unrotate" the vector by `dir`
        let r = this.rotated(-dir);
        // Then, just measure the x portion.
        return r.x;
    }

    /**
     * Return the difference of this vector, and another.
     * I.e., this - other.
     */
    diff(other : DerivablePoint<D>) : DerivablePoint<D> {
        return new DerivablePoint<D>(
            this.x - other.x
          , this.y - other.y
        );
    }

    /**
     * Return the sum of this vector and another.
     * I.e., this + other.
     */
    combined(other : DerivablePoint<D>) : DerivablePoint<D> {
        return new DerivablePoint<D>(
            this.x + other.x
          , this.y + other.y
        );
    }

    /**
     * Returns the distance between this and another DerivablePoint.
     */
    distFrom(other : DerivablePoint<D>) : number {
        let h = this.x - other.x;
        let v = this.y - other.y;
        return Math.sqrt(h*h + v*v);
    }
}

/**
 * A Point is advanced by Velocity over time.
 * Since it's a type alias, you can't call `new Point(x, y)`;
 * use the factory function `point()` instead.
 */
export type Point = DerivablePoint<Acceleration>;

/**
 * A Velocity is advanced by Acceleration over time.
 * Since it's a type alias, you can't call `new Velocity(x, y)`;
 * use the factory function `veloc()` instead.
 */
export type Velocity = DerivablePoint<Acceleration>;

/**
 * An Acceleration isn't normally advanced, but it can be.
 * We're relaxing its rules and letting it be advanced by anything with
 * an x and y.
 *
 * Since it's a type alias, you can't call `new Acceleration(x, y)`;
 * use the factory function `accel()` instead.
 */
export type Acceleration = DerivablePoint<BasicXY>;

// Would make a template once and instantiate it thrice, but TS doesn't currently
// support assigning a template function instantiation to a variable...
/** Create a new [[Point]]. Convenience, since [[Point]] is a type alias and you can't do `new Point()...`  */
export function point(dm : DirMag) : Point;
export function point(x? : number, y? : number) : Point;
export function point(x : any = 0, y : any = 0) : Point {
    if (typeof x == "number" || typeof x === undefined)
        return new DerivablePoint<Velocity>(x, y);
    else
        return new DerivablePoint<Velocity>(x);
}

/** Create a new [[Velocity]]. Convenience, since [[Velocity]] is a type alias and you can't do `new Velocity()...`  */
export function veloc(dm : DirMag) : Velocity;
export function veloc(x? : number, y? : number) : Velocity;
export function veloc(x : any = 0, y : any = 0) : Velocity {
    if (typeof x == "number" || typeof x === undefined)
        return new DerivablePoint<Acceleration>(x, y);
    else
        return new DerivablePoint<Acceleration>(x);
}

/** Create a new [[Acceleration]]. Convenience, since [[Acceleration]] is a type alias and you can't do `new Acceleration()...`  */
export function accel(dm : DirMag) : Acceleration;
export function accel(x? : number, y? : number) : Acceleration;
export function accel(x : any = 0, y : any = 0) : Acceleration {
    if (typeof x == "number" || typeof x === undefined)
        return new DerivablePoint<BasicXY>(x, y);
    else
        return new DerivablePoint<BasicXY>(x);
}

/** A direction (in radians), and a magnitude. */
export type DirMag = { dir: number, mag: number };

/**
 * Accelerates toward a given point.
 */
export function accelToward(from : Point, to : Point, tm : Duration, mag : number) : Velocity {
        let dm = to.diff(from).asDirMag();
        dm.mag = mag;
        let acc = accel(dm);
        return veloc(0, 0).advanced(acc, tm);
}