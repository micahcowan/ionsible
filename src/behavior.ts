/**
 * Provides a number of update behaviors that are useful for game sprites.
 *
 * These are exported as `b`, so if you import ionsible like:
 *
 *     import * as ion from "ionsible"
 *
 * Then you would refer to the behavior [[Momentum]] in this module as
 * `ion.b.Momentum`.
 */
/** Useless docstring for import */
import {
    IUpdatable
  , IDestroyable
  , isDestroyable
  , IBehaviorFactory
  , Sprite
} from "./sprite";
import { Game } from "./game";
import {
    Point
  , Acceleration as DeltaV
  , Duration
  , accel
  , veloc
} from "./space-time";
import {
    DynamicRect
  , getRect
  , shrinkRect
  , clampRadians
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
import {
    KeyHandlerEvent
} from "./event";
import {
    Get
  , getVal
} from "./util";

export type UpdateFunc      = (d : Duration) => void;
export type DestructorFunc  = () => void;

/**
 * Convenience base class for behaviors. See [[makeBehavior]].
 */
class BehaviorBase<S extends Sprite> implements IDestroyable, IUpdatable {
    constructor(
        protected game : Game
      , protected sprite: S
      , private updateFn : UpdateFunc
      , private destructorFn? : DestructorFunc) {}

    destroy() : void {
        if (this.destructorFn !== undefined) this.destructorFn();
        delete this.game;
        delete this.sprite;
    }

    update(delta : Duration) {
        this.updateFn(delta);
    }
}

/**
 * A facility for creating new sprite behaviors.
 *
 * Simply invoke [[makeBehavior]] with an [[UpdateFunc]] as its argument.
 * You may also optionally provide a second argument for use as a [[DestructorFunc]].
 *
 * In order to create a "behavior" that takes parameters, write a function
 * that takes those arguments and returns the results of [[makeBehavior]].
 * See the implementation of [[HandleKeys]] for a concrete example.
 */
export function makeBehavior<S extends Sprite>(updateFn : UpdateFunc, destructorFn? : DestructorFunc) : IBehaviorFactory<S> {
    return (game, sprite) => new BehaviorBase(game, sprite, updateFn, destructorFn);
}

/**
 * Advances the sprite's `pos` by `vel` at each tick.
 * Does _not_ advance `vel` by `accel`.
 *
 * Consider using [[SpeedRamp]] instead.
 */
export let Momentum : IBehaviorFactory<Sprite>
    = makeBehavior(
        (delta : Duration) => {
            this.sprite.pos = this.sprite.pos.advanced(this.sprite.vel, delta);
        }
    );

/**
 * Advances the sprite's `vel` by `accel` at each tick.
 *
 * Consider using [[SpeedRamp]] instead.
 */
export let Acceleration : IBehaviorFactory<Sprite>
    = makeBehavior(
        (delta : Duration) => {
            this.sprite.vel = this.sprite.vel.advanced(this.sprite.accel, delta);
        }
    );

/**
 * Detects when a sprite's position has exceeded certain bounds, and
 * calls the provided callback function.
 *
 * @param drect The rect or rect-producing function describing bounds
 * @param cb The function to call when bounds are exceeded.
 */
export function Bounded(drect : DynamicRect, cb : IBoundsCallback)
        : IBehaviorFactory<Sprite> {
    return makeBehavior(
        (delta : Duration) => {
            let bodyBB = this.sprite.body.bounds;

            let rect : Rect = getRect(this.drect, this.game, this.sprite);
            rect = shrinkRect(rect, bodyBB);

            let exceed = exceedsBounds(this.sprite.pos, rect)
            if (testExceed(exceed)) {
                this.cb(this.sprite, rect, exceed);
            }
        }
    );
}

/**
 * A behavior that maps keypresses to user-specified handler functions.
 * 
 * This behavior continuously invokes the callback for as long
 * as the key is being held. For reaction to just `keyDown` and `keyUp`
 * events, use [[OnKey]] instead.
 */
export function HandleKeys(keys: ActionKeysHandlerMap | ActionKeysHandlerMap[])
        : IBehaviorFactory<Sprite> {
    return (game : Game, sprite : Sprite) =>
        new HandleKeysClass(game, sprite, keys);
}

/**
 * A mapping of key handler functions to the keypresses that may trigger them.
 */
// Tried to do this as a union of interfaces or types, but TypeScript somehow
// wanted to insist that the union (either version) have an index type.
export type ActionKeysHandlerMap = {
    token?: any  // Typically either a string or Symbol
  , handler?: KeyHandlerCallback
  , keys: string | string[]
};

/**
 * A callback for use with [[HandleKeys]].
 */
export interface KeyHandlerCallback {
    (game : Game, sprite : Sprite, delta : Duration) : void;
}
// Used internally as the KeyHandlerCallback when a token is specified rather than callback fn.
let eventFiringKeyHandler : (token: any) => KeyHandlerCallback =
    (token: any) => (game, sprite, delta) => {
        if (token !== undefined) {
            let event = new KeyHandlerEvent(token, delta);
            sprite.handleEvent(event);
        }
    };

class HandleKeysClass extends BehaviorFac implements IUpdatable {
    private mk : Keys;
    private map : { [label: string]: KeyHandlerCallback };

    constructor (game : Game, sprite : Sprite, private keys : ActionKeysHandlerMap | ActionKeysHandlerMap[]) {
        super(game, sprite);

        this.mk = new Keys;
        let adjustedKeys : ActionKeysMap = {};
        this.map = {};
        let i : number = 0;
        if (!(keys instanceof Array))
            keys = [keys];
        keys.forEach(
            ({handler, token, keys: keylist}) => {
                handler = handler === undefined? eventFiringKeyHandler(token) : handler;
                adjustedKeys[i] = keylist
                this.map[i] = handler;
                ++i;
            }
        )
        this.mk.actions(adjustedKeys);
    }

    update(delta : Duration) {
        let tracker = this.mk.pulse();
        for (let key in tracker) {
            if (tracker[key] && key in this.map) {
                this.map[key](this.game, this.sprite, delta);
            }
        }
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

/**
 * A behavior that maps keypresses to changes in sprite rotation.
 */
export function RotateKeys(strength : number, keys: ActionKeysMap)
        : IBehaviorFactory<Sprite> {
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
        let tracker = this.mk.pulse();
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
        : IBehaviorFactory<Sprite> {
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
            spr.vel = veloc(dirMag);
        }
    }
}

/**
 * A behavior that applies a friction to the momentum of a sprite.
 *
 * Consider using [[SpeedRamp]] instead.
 */
export function Friction(strength : number)
        : IBehaviorFactory<Sprite> {
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
        spr.vel = veloc(dm);
    }
}

/**
 * A behavior that applies a limit to sprite velocity.
 *
 * Consider using [[SpeedRamp]] instead.
 */
export function SpeedLimited(limit : number)
        : IBehaviorFactory<Sprite> {
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
 * A behavior that multiplies the thrust determined by [[ThrustKeys]], to
 * produce the desired amount of total acceleration. 
 *
 * Consider using [[SpeedRamp]] instead of this.
 */
export function Thrust(strength : number) : IBehaviorFactory<Sprite> {
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
 * Combines [[Thrust]], [[Acceleration]], [[Friction]], [[SpeedLimited]], and [[Momentum]],
 * in one behavior.
 *
 * Preface this behavior with a [[ThrustKeys]] behavior.
 * 
 * This behavior will calculate the appropriate thrust factor based on
 * its arguments, and multiply the results from [[ThrustKeys]] by it.
 *
 * @param maxSpeed The maximum allowed speed for the sprite
 * @param rampUp The number of seconds required to reach max speed.
 * @param rampDown The number of seconds require to reach zero from max speed.
 */
export function SpeedRamp(maxSpeed : number, rampUp : number,
                          rampDown : number) : IBehaviorFactory<Sprite> {
    return (game : Game, sprite : Sprite) =>
        new SpeedRampClass(game, sprite, maxSpeed, rampUp, rampDown);
}

class OnKeyClass extends BehaviorFac implements IUpdatable, IDestroyable {
    private mk : Keys;

    private fire : (s: Sprite) => void;
    constructor(game : Game, sprite : Sprite, spec : KeyHandlerSpec) {
        super(game, sprite);

        this.mk = new Keys;
        if (spec.fire !== undefined) {
            this.fire = spec.fire;
        }
        else if (spec.token !== undefined) {
            let handler = eventFiringKeyHandler(spec.token);
            this.fire = (s) => handler(game, s, new Duration(0))
        }
        else {
            // Can't do anything, so we won't :/
            this.fire = (s) => {};
        }
        if (spec.keyUp) {
            this.mk.onUp(spec.keyUp, () => {
                if (!this.game.paused)
                    this.fire(this.sprite);
            });
        }
        if (spec.keyDown) {
            this.mk.onDown(spec.keyDown, () => {
                if (!this.game.paused)
                    this.fire(this.sprite);
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
export function OnKey<S extends Sprite>(spec : KeyHandlerSpec) : IBehaviorFactory<Sprite> {
    return (game : Game, sprite : S) =>
        new OnKeyClass(game, sprite, spec);
}

/**
 * Callback specification that triggers once on `keyUp` or `keyDown`,
 * rather than continuously as the key is held, as [[HandleKeys]] does.
 */
export type KeyHandlerSpec = {
    keyUp?: string | string[]
  , keyDown?: string | string[]
  , fire?: (sprite : any) => any
  , token?: any
}

class RotateTowardPlusClass extends BehaviorFac implements IUpdatable {
    update(delta : Duration) {
        let sp = this.sprite;
        let dest = getVal(this.loc);
        if (!dest) return;

        // Find out which direction is from the sprite, toward dest
        let dm = sp.pos.diff(dest).asDirMag();
        // A conversion: zero degrees is pointing straight right;
        // But a sprite is normally made with the top pointing "up"
        // at zero degrees.
        let desiredDir = dm.dir - Math.PI / 2 + this.addRot;

        let maxRot = this.rotSpeed * delta.s;
        let desiredRot = clampRadians(desiredDir - sp.rotation);
        // Rotate whichever direction is closest (clockwise? counter?):
        if (desiredRot > Math.PI)
            desiredRot -= 2 * Math.PI;

        let scaleDown = maxRot / Math.abs(desiredRot);
        sp.rotation += desiredRot * (scaleDown < 1? scaleDown : 1);
    }

    constructor(
        g : Game
      , s : Sprite
      , private loc : Get<Point | undefined>
      , private addRot : number = 0
      , private rotSpeed : number = 2 * Math.PI
    ) {
        super(g, s);
    }
}

/**
 * Maintain a rotation for the sprite, pointing toward the given coordinate.
 * If the point is undefined, rotation remains at its current value.
 * Assumes the top side of the sprite should be the one facing.
 *
 * @param loc the point toward which the sprite will be rotated (or `undefined`). Or, a function returning a [[Point]] or `undefined`.
 * @param rotSpeed the speed at which the sprite will be rotated to point at that orientation, in radians per second.
 */
export function RotateToward(loc: Get<Point | undefined>, rotSpeed : number = 2 * Math.PI) : IBehaviorFactory<Sprite> {
    return ((game, sprite) => new RotateTowardPlusClass(game, sprite, loc, 0, rotSpeed));
}

/**
 * Maintain a rotation for the sprite, pointing toward the given coordinate, offset by `addedRot`.
 * If the point is undefined, rotation remains at its current value.
 * Assumes the top side of the sprite should be the one facing.
 *
 * @param loc the point toward which the sprite will be rotated (or `undefined`). Or, a function returning a [[Point]] or `undefined`.
 * @param addedRot the amount of rotation (in radians) to add to the rotation determined to be "towarad" `loc`.
 * @param rotSpeed the speed at which the sprite will be rotated to point at that orientation, in radians per second.
 */
export function RotateTowardPlus(loc: Get<Point | undefined>, addRot : number, rotSpeed : number = 2 * Math.PI) : IBehaviorFactory<Sprite> {
    return ((game, sprite) => new RotateTowardPlusClass(game, sprite, loc, addRot, rotSpeed));
}

/**
 * Maintain a rotation for the sprite, pointing away from the given coordinate.
 * If the point is undefined, rotation remains at its current value.
 * Assumes the top side of the sprite should be the one facing away.
 *
 * @param loc the point away from which the sprite will be rotated (or `undefined`). Or, a function returning a [[Point]] or `undefined`.
 * @param rotSpeed the speed at which the sprite will be rotated to point at that orientation, in radians per second.
 */
export function RotateAwayFrom(loc: Get<Point | undefined>, rotSpeed : number = 2 * Math.PI) : IBehaviorFactory<Sprite> {
    return ((game, sprite) => new RotateTowardPlusClass(game, sprite, loc, Math.PI, rotSpeed));
}