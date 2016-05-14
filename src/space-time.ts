/**
 * This module provides type-safe facilities for representing
 * timestamps, durations of time, and positions and velocities in 2d
 * space.
 */

/**
 * Represents a moment in time. Wraps the builtin Date class.
 */
export class Timestamp {
    protected _stamp : number;

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
    protected _ms : number;

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
