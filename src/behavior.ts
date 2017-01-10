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
import {
    IUpdatable
  , IDestroyable
  , isDestroyable
  , IBehaviorFactory
  , Sprite
} from "./sprite";
import { Game } from "./game";
import {
    Acceleration as DeltaV
  , Duration
  , accel
  , veloc
  , xyFromDirMag
} from "./space-time";
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
export class BehaviorFac implements IDestroyable {
    constructor(protected game : Game, protected sprite: Sprite) {}

    destroy() : void {
        //this.game = null;
        //this.sprite = null;
        delete this.game;
        delete this.sprite;
    }
}

class MomentumClass extends BehaviorFac implements IUpdatable {
    update(delta : Duration) {
        this.sprite.pos = this.sprite.pos.advanced(this.sprite.vel, delta);
    }
}

/**
 * Advances the sprite's `pos` by `vel` at each tick.
 * Does _not_ advance `vel` by `accel`.
 *
 * Consider using `SpeedRamp` instead.
 */
export let Momentum : IBehaviorFactory
    = (game, sprite) => new MomentumClass(game, sprite);

class AccelerationClass extends BehaviorFac implements IUpdatable {
    update(delta : Duration) {
        this.sprite.vel = this.sprite.vel.advanced(this.sprite.accel, delta);
    }
}

/**
 * Advances the sprite's `vel` by `accel` at each tick.
 *
 * Consider using `SpeedRamp` instead.
 */
export let Acceleration : IBehaviorFactory
    = (game, sprite) => new AccelerationClass(game, sprite);

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
        this.sprite.rotation %= 2*Math.PI;
        if (this.sprite.rotation < 0)
            this.sprite.rotation += 2*Math.PI;
    }
    // FIXME: Needs a "destroy" function (that would actually be used), that
    // destroys the keys association.

    destroy() : void {
        this.mk.destroy();
        //this.mk = null;
        delete this.mk

        super.destroy();
    }
}

//export type RotateKeysMap = { clock: string[] | string, counter: string[] | string };

class ThrustKeysClass extends BehaviorFac implements IUpdatable, IDestroyable {
    private mk : Keys;

    private sideToAccel : { [key: string] : DeltaV } = {
        forward:    accel(1, 0)
      , back:       accel(-1, 0)
      , left:       accel(0, -1)
      , right:      accel(0, 1)
    };

    constructor(game : Game, sprite : Sprite,
                private keys : ActionKeysMap) {
        super(game, sprite);

        this.mk = new Keys;
        this.mk.actions(keys);
    }

    update(delta : Duration) : void {
        let tracker = this.mk.pulse();
        let dir = this.sprite.rotation;
        this.sprite.accel = accel(0, 0);
        let acc = accel(0, 0);
        Object.keys(this.sideToAccel).forEach(side => {
            if (tracker[side]) {
                let a = this.sideToAccel[side];
                acc = accel(acc.x + a.x, acc.y + a.y);
            }
        });
        acc = acc.rotated(dir);
        this.sprite.accel = acc;
    }

    destroy() : void {
        this.mk.destroy();
        //this.mk = null;
        delete this.mk;

        super.destroy();
    }
}

/**
 * A behavior that maps keypresses to changes in sprite velocity.
 */
export function ThrustKeys(keys: ActionKeysMap)
        : IBehaviorFactory {
    return (game : Game, sprite : Sprite) =>
        new ThrustKeysClass(game, sprite, keys);
}

class FrictionClass extends BehaviorFac implements IUpdatable {
    // strength is in pixels per second per second.
    constructor(game : Game, sprite : Sprite, public strength : number) {
        super(game, sprite);
    }

    update(delta : Duration) {
        let spr = this.sprite;
        let dirMag = spr.vel.asDirMag();
        let adjFric = this.strength * delta.s;
        if (adjFric >= dirMag.mag) {
            // Friction has brought sprite to a stop.
            spr.vel = veloc(0, 0);
        }
        else {
            dirMag.mag -= adjFric;
            let xy = xyFromDirMag(dirMag);
            spr.vel = veloc(xy.x, xy.y);
        }
    }
}

/**
 * A behavior that applies a friction to the momentum of a sprite.
 *
 * Consider using `SpeedRamp` instead.
 */
export function Friction(strength : number)
        : IBehaviorFactory {
    return (game : Game, sprite : Sprite) =>
        new FrictionClass(game, sprite, strength);
}

class SpeedLimitedClass extends BehaviorFac implements IUpdatable {
    // limit is in pixels per second.
    constructor(game : Game, sprite : Sprite, public limit : number) {
        super(game, sprite);
    }

    update(delta : Duration) : void {
        let spr = this.sprite;
        let dm = spr.vel.asDirMag();
        if (dm.mag > this.limit)
            dm.mag = this.limit;
        let xy = xyFromDirMag(dm)
        spr.vel = veloc(xy.x, xy.y);
    }
}

/**
 * A behavior that applies a limit to sprite velocity.
 *
 * Consider using `SpeedRamp` instead.
 */
export function SpeedLimited(limit : number)
        : IBehaviorFactory {
    return (game : Game, sprite : Sprite) =>
        new SpeedLimitedClass(game, sprite, limit);
}

class ThrustClass extends BehaviorFac implements IUpdatable {
    constructor(game : Game, sprite : Sprite, private strength : number) {
        super(game, sprite);
    }
    update(delta : Duration) : void {
        let a = this.sprite.accel;
        this.sprite.accel = accel(this.strength * a.x, this.strength * a.y);
    }
}

/**
 * A behavior that multiplies the thrust determined by `ThrustKeys`, to
 * produce the desired amount of total acceleration. 
 *
 * Consider using `SpeedRamp` instead of this.
 */
export function Thrust(strength : number) : IBehaviorFactory {
    return (game : Game, sprite : Sprite) =>
        new ThrustClass(game, sprite, strength);
}

class SpeedRampClass extends BehaviorFac implements IUpdatable, IDestroyable {
    private behaviorsInst : IUpdatable[];

    constructor(game : Game, sprite : Sprite, maxSpeed : number,
                rampUp : number, rampDown : number) {
        super(game, sprite);

        let friction = maxSpeed / rampDown;
        let thrust = maxSpeed / rampUp + friction;

        let b : IUpdatable[] = this.behaviorsInst = [];
        b.push( (Thrust(thrust))(game, sprite) );
        b.push( (Acceleration)(game, sprite) );
        b.push( (Friction(friction))(game, sprite) );
        b.push( (SpeedLimited(maxSpeed))(game, sprite) );
        b.push( (Momentum)(game, sprite) );
    }

    update(delta : Duration) : void {
        let a = this.sprite.accel
        //if (a.x != 0 || a.y != 0) debugger;

        this.behaviorsInst.forEach(b => b.update(delta));
    }

    destroy() : void {
        let bs = this.behaviorsInst;
        while (bs.length > 0) {
            let b = bs.pop() as any | IDestroyable;
            if (isDestroyable(b))
                b.destroy();
        }

        super.destroy();
    }
}

/**
 * Combines Thrust, Acceleration, Friction, SpeedLimited, and Momentum,
 * in one behavior.
 *
 * Preface this behavior with `ThrustKeys`.
 * This behavior will calculate the appropriate thrust factor based on
 * its arguments, and multiply the results from ThrustKeys by it.
 *
 * @param maxSpeed The maximum allowed speed for the sprite
 * @param rampUp The number of seconds required to reach max speed.
 * @param rampDown The number of seconds require to reach zero from max speed.
 */
export function SpeedRamp(maxSpeed : number, rampUp : number,
                          rampDown : number) : IBehaviorFactory {
    return (game : Game, sprite : Sprite) =>
        new SpeedRampClass(game, sprite, maxSpeed, rampUp, rampDown);
}

class OnKeyClass extends BehaviorFac implements IUpdatable, IDestroyable {
    private mk : Keys;

    constructor(game : Game, sprite : Sprite, spec : KeyHandlerSpec) {
        super(game, sprite);

        this.mk = new Keys;
        if (spec.keyUp) {
            this.mk.onUp(spec.keyUp, () => {
                if (!this.game.paused)
                    spec.fire(this.sprite);
            });
        }
        if (spec.keyDown) {
            this.mk.onDown(spec.keyDown, () => {
                if (!this.game.paused)
                    spec.fire(this.sprite);
            });
        }
    }

    update() {}

    destroy() : void {
        this.mk.destroy();
    }
}

/**
 * Connects a key event to a handler, as a behavior.
 *
 * Key event is discarded if it occurs while game is paused.
 */
export function OnKey(spec : KeyHandlerSpec) : IBehaviorFactory {
    return (game : Game, sprite : Sprite) =>
        new OnKeyClass(game, sprite, spec);
}

export type KeyHandlerSpec = {
    keyUp?: string | string[]
  , keyDown?: string | string[]
  , fire: (sprite : any) => any
}
