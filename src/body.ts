/**
 * Body class definitions, implementing the `IBody` interface from
 * the `"shape"` module.
 *
 * This module is normally imported under a `body` sub-namespace. For
 * example, `ion.body.Circle`.
 */

import { IBody } from "./shape";
import { Point } from "./space-time";

/**
 * This represents a nonexistent body that never collides.
 * It is the default type of body for sprites, if no other body is
 * specified.
 */
export class None implements IBody {
    bounds = { x: 0, y: 0, w: 0, h: 0 }
    collides(body, pos)     { return false; }
    pointInBody(pt)         { return false; }

    /** Always easiest for a `body.None` to check. :) */
    canHandle(other)        { return true; }
}

/** Convenient instance of `body.None`. */
export let none = new None;

/**
 * A circular body, with a radius and optional offset from sprite
 * center.
 */
export class Circle implements IBody {
    public bounds;

    constructor(private r : number, private offset? : Point) {
        this.bounds = { t: -r, l: -r, b: r, r: r };
    }

    collides(other : IBody, offset : Point) : boolean {
        // TODO: Implement!
        return true;
    }

    pointInBody(pt : Point) : boolean {
        // TODO: Implement!
        return true;
    }

    canHandle(other : IBody) : boolean {
        return (other instanceof Circle);
    }
}

/*
   TODO: other body types:

   Rect
   Path
   Image
 */
