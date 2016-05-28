/**
 * Provides a number of update behaviors that are useful for game sprites.
 *
 * These are exported as `b`, so if you import ionsible like:
 *
 *     import * as ion from "ionsible"
 *
 * Then you would refer to the behavior `Momentum` in this module as
 * `ion.b.Momentum`.
 */
import { IUpdatable, IBehaviorFactory, Sprite } from "./sprite";
import { Game } from "./game";
import { Duration } from "./space-time";
import {
    DynamicRect
  , getRect
  , shrinkRect
} from "./util";
import {
    Rect
  , IBoundsCallback
  , exceedsBounds
  , testExceed
} from "./shape";
import {
    ActionKeysMap
  , Keys
} from "./keys";

/**
 * Convenience base class for behaviors, which saves away the required
 * `game` and `sprite` arguments.
 */
class BehaviorFac {
    constructor(protected game : Game, protected sprite: Sprite) {}
}

class MomentumClass extends BehaviorFac implements IUpdatable {
    update(delta : Duration) {
        this.sprite.pos = this.sprite.pos.advance(this.sprite.vel, delta);
    }
}

/**
 * Advances the sprite's `pos` by `vel` at each tick.
 * Does _not_ advance `vel` by `accel`.
 */
export let Momentum : IBehaviorFactory
    = (game, sprite) => new MomentumClass(game, sprite);

/**
 * Detects when a sprite's position has exceeded certain bounds, and
 * calls the provided callback function.
 *
 * @param drect The rect or rect-producing function describing bounds
 * @param cb The function to call when bounds are exceeded.
 */
export function Bounded(drect : DynamicRect, cb : IBoundsCallback)
        : IBehaviorFactory {
    return (game : Game, sprite : Sprite) =>
        new BoundedClass(game, sprite, drect, cb);
}

class BoundedClass extends BehaviorFac implements IUpdatable {
    constructor(game : Game, sprite : Sprite,
                private drect : DynamicRect, private cb : IBoundsCallback) {
        super(game, sprite);
    }
    update(delta : Duration) {
        let bodyBB = this.sprite.body.bounds;

        let rect : Rect = getRect(this.drect, this.game, this.sprite);
        rect = shrinkRect(rect, bodyBB);

        let exceed = exceedsBounds(this.sprite.pos, rect)
        if (testExceed(exceed)) {
            this.cb(this.sprite, rect, exceed);
        }
    }
}

/**
 * A behavior that maps keypresses to changes in sprite rotation.
 */
export function RotateKeys(strength : number, keys: ActionKeysMap)
        : IBehaviorFactory {
    return (game : Game, sprite : Sprite) =>
        new RotateKeysClass(game, sprite, strength, keys);
}

class RotateKeysClass extends BehaviorFac implements IUpdatable {
    private mk : Keys;

    constructor (game : Game, sprite : Sprite,
                 public strength : number, private keys : ActionKeysMap) {
        super(game, sprite);

        this.mk = new Keys;
        this.mk.actions(keys);
    }

    update(delta : Duration) {
        let tracker = this.mk.pulse() as any;
        if (tracker.clock)
            this.sprite.rotation += this.strength * delta.s;
        if (tracker.counter)
            this.sprite.rotation -= this.strength * delta.s;
    }
    // FIXME: Needs a "destroy" function (that would actually be used), that
    // destroys the keys association.
}

//export type RotateKeysMap = { clock: string[] | string, counter: string[] | string };
