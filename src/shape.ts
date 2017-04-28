/**
 * Facilities for defining bounds and bodies.
 *
 * Actual body classes are defined in the `body` module (see link at right).
 */

/** Useless docstring for import */
import { Point } from "./space-time";
import { Sprite } from "./sprite";

/** Rectangle represented as top, left, bottom, right.
 *
 * Example: `{ t: 0, l: 0, b: 480, r: 640 }`
*/
export type TLBR = {
    t : number
  , l : number
  , b : number
  , r : number
};

/**
 * Rectangle represented as x, y, width, height.
 * The `x` and `y` are the top-left corner, as `t`
 * and `r` are in [[TLBR]]; but instead of bottom
 * and right coordinates, width and height are used.
 *
 * Example: `{ x: 0, y: 0, w: 480, h: 640 }`
*/
export type XYWH = {
    x : number
  , y : number
  , w : number
  , h : number
}

/** Rectangle by any other name... */
export type Rect = TLBR | XYWH;

/**
 * Get a [[TLBR]] rectangle representation,
 * 
 * @param arg A rectangle in either [[TLBR]] or [[XYWH]] notation.
 * @return A rectangle in [[TLBR]] notation.
 */
export function getTLBR(arg : Rect) : TLBR {
    let tlbr = <TLBR>arg;
    let xywh = <XYWH>arg;
    if (tlbr.t !== undefined && tlbr.l !== undefined
            && tlbr.b !== undefined && tlbr.r !== undefined) {
        return tlbr;
    }
    else {
        return {
            l: xywh.x
          , t: xywh.y
          , r: xywh.x + xywh.w
          , b: xywh.y + xywh.h
        };
    }
}

/**
 * Get a [[XYWH]] rectangle representation,
 * 
 * @param arg A rectangle in either [[TLBR]] or [[XYWH]] notation.
 * @return A rectangle in [[XYWH]] notation.
 */
export function getXYWH(arg : Rect) : XYWH {
    let tlbr = <TLBR>arg;
    let xywh = <XYWH>arg;
    if (xywh.x !== undefined && xywh.y !== undefined
            && xywh.w !== undefined && xywh.h !== undefined) {
        return xywh;
    }
    else {
        return {
            x: tlbr.l
          , y: tlbr.t
          , w: tlbr.r - tlbr.l
          , h: tlbr.b - tlbr.t
        };
    }
}

/**
 * Represents the amount by which the bounds were exceeded, in x and y.
 *
 * A negative number indicates exceeding the left/top bound, positive
 * the right/bottom.
 *
 * Subtracting this value from a sprite's position x and y corrects the
 * position to remain within the bounds (assuming it doesn't cause
 * exceeding the other side).
 */
export interface Exceed {
    x : number;
    y : number;
}

/**
 * Tests whether an [[Exceed]] value represents an exceeded boundary.
 *
 * @returns `true` unless `x` and `y` are both 0.
 */
export function testExceed(e : Exceed) : boolean {
    return e.x != 0 || e.y != 0;
}

/**
 * Type of a callback function, called when a sprite has exceeded
 * defined boundaries.
 */
export type IBoundsCallback
    = (sprite : Sprite, bounds : Rect, exceed : Exceed) => void;

/**
 * Returns which sides (if any) of a boundary were exceeded.
 */
export function exceedsBounds(pt : Point, rect : Rect) : Exceed {
    let tlbr : TLBR       = getTLBR(rect);
    let exceed = { x: 0, y: 0 }

    if (pt.x < tlbr.l)
        exceed.x = pt.x - tlbr.l;
    else if (pt.x > tlbr.r)
        exceed.x = pt.x - tlbr.r;

    if (pt.y < tlbr.t)
        exceed.y = pt.y - tlbr.t;
    else if (pt.y > tlbr.b)
        exceed.y = pt.y - tlbr.b;

    return exceed;
}

/**
 * Describes a 2D body that can collide with other such bodies.
 */
export interface IBody {
    /**
     * The minimum bounds containing this body.
     */
    bounds : Rect;

    /**
     * Check whether this body collides with another.
     *
     * @param offset The offset of other, relative to this body.
     */
    collides(other : IBody, offset : Point) : boolean;

    /**
     * Check whether a given point is contained in this body.
     */
    pointInBody(pt : Point) : boolean;

    /**
     * Check whether this body has special handling for another type of
     * body. If so, then this body's collision handling will be used in
     * preference over `other`'s.
     *
     * @returns a `true` value indicates we can handle collision checking
     * against the other body quickly. `false` suggests that
     * `other.collides(this)` is probably at least as fast as ours.
     */
    canHandle(other : IBody) : boolean;
}
