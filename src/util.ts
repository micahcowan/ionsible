/**
 * A number of convenient utility types, interfaces, and functions.
 */
import { Game } from "./game";
import { Sprite } from "./sprite";
import { Point, point, veloc } from "./space-time";
import {
    Exceed
  , IBoundsCallback
  , Rect
  , getTLBR
} from "./shape";

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
        = (sprite : Sprite, bounds : Rect, exceed : Exceed) => {
    let {x, y} = sprite.pos;
    let {t, l, b, r} = getTLBR(bounds);
    let {x: h, y: v} = sprite.vel;

    if (exceed.x != 0) {
        x = (exceed.x < 0? l : r) - exceed.x;
        h = -h;
    }

    if (exceed.y != 0) {
        y = (exceed.y < 0? t : b) - exceed.y;
        v = -v;
    }

    sprite.pos = point(x, y);
    sprite.vel = veloc(h, v);
};

/**
 * Tests whether val is null or undefined.
 *
 * You can use this with a type such as:
 *
 *     let obj : { x : number } | void = { x: 10 }
 *     return obj.x // ERROR! .x isn't in type: [blah] | void
 *     if (!isVoid(obj)) return obj.x; // OKAY
*/
export function isVoid(val : void | any) : val is void {
    return (val === undefined) || (val === null);
}

/**
 * Shrinks `arect` by the dimensions of `brect`, such that
 * checking a single point centered in `brect` by the bounds of `arect`
 * is the same as checking `brect` by the bounds of `arect`.
 */
export function shrinkRect(arect : Rect, brect : Rect) : Rect {
    let aR = getTLBR(arect);
    let bR = getTLBR(brect);
    return {
        t: aR.t - bR.t
      , l: aR.l - bR.l
      , b: aR.b - bR.b
      , r: aR.r - bR.r
    };
}
