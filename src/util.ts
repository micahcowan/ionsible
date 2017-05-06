/**
 * A number of convenient utility types, interfaces, and functions.
 */
import { Game } from "./game";
import { Sprite } from "./sprite";
import { point, veloc, accel, Velocity, Acceleration } from "./space-time";
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

/**
 * Clamps an expression of radians to between positive 0 and TAU.
 */
export function clampRadians(dir : number) : number {
    let tau = Math.PI * 2;
    if (dir < 0) {
        dir = -dir % tau;
        dir = tau - dir;
    }
    else {
        dir %= tau;
    }

    return dir;
}

/**
 * Converts a scale between two values, to a scale between two other values.
 *
 * Call this function with initialization values, to produce a function you may
 * call repeatedly with an input value, to return an output value.
 *
 * Note: min and max don't have to actually be the smallest/largest values.
 *
 * ```
 * let ramp = makeScalingRamp(2, 3, 0, 0.5);
 * let value = ramp(2.5);
 * value == 0.25; // Halfway between input values = halfway between output.
 * ```
 */
export function makeScalingRamp(inMin : number, inMax : number,
        outMin : number, outMax : number) : (n: number) => number {
    return (inVal) => {
        // Clamp the input value to the provided min/max
        if (inVal > Math.max(inMin, inMax)) {
            inVal = Math.max(inMin, inMax);
        }
        else if (inVal < Math.min(inMin, inMax)) {
            inVal = Math.min(inMin, inMax);
        }

        // Convert to scale of 0 to 1
        let scale = (inVal - inMin) / (inMax - inMin);
        let out = outMin + scale * (outMax - outMin);
        return out;
    };
}

/**
 * Given how high you want a jump to be, and how long you want to take from
 * start of the jump to hitting the ground again, returns
 * the gravity accelleration to use. Pair with [[getJumpSpeed]].
 * @param height how high you want the jump to reach
 * @param time how long (in seconds) the total jump should take
 * @return the downward (positive y) [[Acceleration]] for gravity
 */
export function getJumpGravity(height : number, time : number) : Acceleration {
    let grav = 8 * height / (time * time);
    return accel(0, grav);
}

/**
 * Given how high you want a jump to be, and how long you want to take from
 * start of the jump to hitting the ground again, returns
 * the initial velocity for a jump. Pair with [[getJumpGravity]].
 * @param height how high you want the jump to reach
 * @param time how long (in seconds) the total jump should take
 * @return the upward (negative y) [[Velocity]] for the jump
 */
export function getJumpSpeed(height : number, time : number) : Velocity {
    let spd = 4 * height / time;
    return veloc(0, -spd);
}