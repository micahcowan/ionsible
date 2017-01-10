/**
 * Body class definitions, implementing the `IBody` interface from
 * the `"shape"` module.
 *
 * This module is normally imported under a `body` sub-namespace. For
 * example, `ion.body.Circle`.
 */

import { IBody, Rect } from "./shape";
import { Point } from "./space-time";
import { IPositionedDrawable } from "./sprite";

/**
 * This represents a nonexistent body that never collides.
 * It is the default type of body for sprites, if no other body is
 * specified.
 */
export class None implements IBody {
    bounds : Rect = { x: 0, y: 0, w: 0, h: 0 }

    collides(other : IBody, offset : Point) : boolean {
        return false;
    }

    pointInBody(pt : Point) : boolean {
        return false;
    }

    /** Always easiest for a `body.None` to check. :) */
    canHandle(other : IBody) : boolean {
        return true;
    }
}

/** Convenient instance of `body.None`. */
export let none = new None;

/**
 * A circular body, with a radius and optional offset from sprite
 * center.
 */
export class Circle implements IBody {
    public bounds : Rect;

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

/**
 * A bundle of connected lines. Rotates with sprite.
 */
export class Polygon implements IBody {
    get bounds() : Rect {
        let pts = this.getRotatedPoints();
        // Get the minimum bounds from the points.
        let [t, l, b, r] = [0, 0, 0, 0];
        pts.forEach(pt => {
            t = Math.min(t, pt.y);
            l = Math.min(l, pt.x);
            b = Math.max(b, pt.y);
            r = Math.max(r, pt.x);
        })

        return {t: t, l: l, b: b, r: r};
    }

    private points : Point[];
    /**
     * @param sprite It's okay for this parameter to be null, in which
     * case points won't be rotated.
     */
    constructor(private sprite : IPositionedDrawable, points : Point[]) {
        this.points = points.slice();
    }

    getRotatedPoints() : Point[] {
        let r  = 0;
        if (this.sprite)
            r = this.sprite.rotation;
        return this.points.map(p => p.rotated(r));
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
        // TODO: Implement!
        return false;
    }
}

/*
   TODO: other body types:

   Rect
   Path
   Image
 */
