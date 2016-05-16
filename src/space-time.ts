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
 * or a Velocity to be advanced by an Acceleration over time.
 * If a third derivative is called for (unlikely?), an Acceleration is
 * advanced by any unspecified BasicXY (this allows advancing an
 * Acceleration by a Point or Velocity, but this is not encouraged).
 *
 * The intention is to force separation between a Position over time,
 * and its derivatives (Velocity, Acceleration), requiring time
 * (Duration) to be involved at each step.
 */
export class DerivablePoint<D extends BasicXY> {
    constructor(private _x : number = 0, private _y : number = 0) {}
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
     * Advance by an amount approprite by the amount of time that's
     * passed.
     *
     * If we're a Point, advances according to Velocity.
     * If we're a Velocity, advances according to Acceleration.
     */
    advance(v : D, t : Duration) : DerivablePoint<D> {
        return new DerivablePoint<D>(
            this._x + (v.x * t.s)
          , this._y + (v.y * t.s)
        );
    }
}

/**
 * A Point is advanced by Velocity over time.
 * Since it's a type alias, you can't call `new Point(x, y)`;
 * use the factory function `point()` instead.
 */
export type Point = DerivablePoint<Velocity>;
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

/** Create a new Point. */
export function point(x : number = 0, y : number = 0) : Point {
    return new DerivablePoint<Velocity>(x, y);
}
/** Create a new Velocity. */
export function veloc(x : number = 0, y : number = 0) : Velocity {
    return new DerivablePoint<Acceleration>(x, y);
}
/** Create a new Acceleration. */
export function accel(x : number = 0, y : number = 0) : Acceleration {
    return new DerivablePoint<BasicXY>(x, y);
}
