/**
 * A number of convenient utility types, interfaces, and functions.
 */
import { Game } from "./game";
import { Sprite } from "./sprite";
import { Point, point, veloc } from "./space-time";

/** Rectangle represented as top, left, bottom, right. */
export type TLBR = {
    t : number
  , l : number
  , b : number
  , r : number
};

/** Rectangle represented as x, y, width, height. */
export type XYWH = {
    x : number
  , y : number
  , w : number
  , h : number
}

/** Rectangle by any other name... */
export type Rect = TLBR | XYWH;

/** Get a TLBR rectangle from either representation. */
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

/** Get a XYWH rectangle from either representation. */
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

/** Function that takes a game and sprite, and returns a rectangle **/
export type RectCalculator = (game : Game, sprite: Sprite) => Rect;

/** Either a rectangle, or a function that can get one for a good price. */
export type DynamicRect = Rect | RectCalculator

/**
 * Takes what might be a rectangle or a rectangler, and makes sure you
 * get a rectangle back out.
 */
export function getRect(rect : DynamicRect, game : Game,
                        sprite : Sprite) : Rect {
    if (typeof rect == "function") {
        return (<RectCalculator>rect)(game, sprite);
    }
    else {
        return <Rect>rect;
    }
}

/**
 * Indicates what side of a set of boundaries was exceeded.
 * If multiple sides were exceeded, a bitwise or will be used.
 */
export enum BoundsSide {
    None    = 0
  , Top     = 1
  , Left    = 2
  , Bottom  = 4
  , Right   = 8
}

/**
 * Type of a callback function, called when a sprite has exceeded
 * defined boundaries.
 */
export type IBoundsCallback
    = (sprite : Sprite, bounds : Rect, side : BoundsSide) => void;

/**
 * Returns which sides (if any) of a boundary were exceeded.
 */
export function exceedsBounds(pt : Point, rect : Rect) : BoundsSide {
    let tlbr : TLBR       = getTLBR(rect);
    let side : BoundsSide = BoundsSide.None;

    if (pt.x < tlbr.l)
        side |= BoundsSide.Left;
    else if (pt.x > tlbr.r)
        side |= BoundsSide.Right;

    if (pt.y < tlbr.t)
        side |= BoundsSide.Top;
    else if (pt.y > tlbr.b)
        side |= BoundsSide.Bottom;

    return side;
}

/**
 * Provides a set of boundaries representing the size of the canvas.
 * Not really useful for games with a moving camera, but otherwise can
 * keep everything bouncing around within its view.
 */
export let gameRect : RectCalculator = (game : Game, sprite : Sprite) => ({
    t: 0, l: 0, b: game.canvas.height, r: game.canvas.width
});

/**
 * Responds to an exceeded boundary by bouncing the position back
 * inside the bounds.
 */
export let spriteBounce : IBoundsCallback
        = (sprite : Sprite, bounds : Rect, side : BoundsSide) => {
    let {x, y} = sprite.pos;
    let {t, l, b, r} = getTLBR(bounds);
    let {x: h, y: v} = sprite.vel;

    if (side & BoundsSide.Left) {
        x = l + (l - x);
        h = -h;
    }
    else if (side & BoundsSide.Right) {
        x = r - (x - r);
        h = -h;
    }

    if (side & BoundsSide.Top) {
        y = t + (t - y);
        v = -v;
    }
    else if (side & BoundsSide.Bottom) {
        y = b - (y - b);
        v = -v;
    }

    sprite.pos = point(x, y);
    sprite.vel = veloc(h, v);
};
