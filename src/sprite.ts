/**
 * Provides the [[Sprite]] class, and various related interfaces.
 */

/** Useless docstring for import */
import {
    Duration
  , Point
  , Velocity
  , Acceleration
  , point
  , veloc
  , accel }
    from "./space-time";
import { Game } from "./game";
import { IBody } from "./shape";
import * as body from "./body";
import { Event, IEventListener } from "./event";

/**
 * Interface for things that can be drawn by the game.
 */
export interface IDrawable {
    /**
     * Draw sprite to canvas.
     *
     * The game first translates the position so that the origin is at
     * the sprite's x, y coordinates relative to the camera, and resets the
     * context's path.
     */
    draw(c: CanvasRenderingContext2D) : void;
}

export interface IPositionedDrawable extends IDrawable {
    /**
     * The sprite's global position. Needed to translate coordinates for the
     * camera.
     */
    pos : Point;

    /**
     * The sprite's rotation, expressed in radians.
     */
    rotation: number;

    /**
     * Whether rotation should be applied before the game calls
     * [[IDrawable.draw]]() (alleviating the need for the rotation
     * to be done within [[IDrawable.draw]]() itself).
     */
    autoRotate: boolean;
}

/** Facility to determine whether an object is an [[IPositionedDrawable]] */
export function isPositionedDrawable(b : any | IPositionedDrawable) : b is IPositionedDrawable {
    return typeof b.pos === "object" && typeof b.rotation === "number"
        && typeof b.autoRotate === "boolean";
}

/**
 * Interface for things that are updated by the game.
 */
export interface IUpdatable {
    /**
     * Updates sprite state (usually, position and such)
     *
     * Normally, the implementation in the Sprite class should be used,
     * and behavior should be overridden via the [[Sprite.behaviors]] field.
     */
    update(delta: Duration) : void;
}

/** Facility to determine whether the argument is an [[IUpdatable]]. */
export function isUpdatable(b : any | IUpdatable) : b is IUpdatable {
    return (b.update !== undefined && b.update !== null)
}

/** An interface that provides a destructor (cleanup function). */
export interface IDestroyable {
    destroy() : void;
}

/** An interface to determine whether the object is an [[IDestroyable]]. */
export function isDestroyable(b : any | IDestroyable) : b is IDestroyable {
    return (b.destroy !== undefined && b.destroy !== null);
}

/**
 * Sprites are both updated, and drawn to canvas, so [[ISprite]] combines
 * both features, as well as a destruction facility.
 */
export interface ISprite extends IPositionedDrawable, IUpdatable, IDestroyable, IEventListener {
}

/**
 * Facility to determine whether the argument implements [[ISprite]].
 */
export function isISprite(b : any | ISprite) : b is ISprite {
    return isPositionedDrawable(b) && isUpdatable(b) && isDestroyable(b);
}

/**
 * A "factory function" that produces an [[IUpdatable]].
 */
export interface IBehaviorFactory<S extends Sprite> {
    (game : Game, sprite : S) : IUpdatable;
}

/**
 * A container type for sprites.
 */
export interface ISpriteContainer {
    subsprites : ISprite[];
}

export function isSpriteContainer(arg : any | ISpriteContainer)
        : arg is ISpriteContainer {
    return (arg.subsprites !== undefined);
}

/**
 * The sprite class. The top-level [[Game]] object neither knows nor
 * cares about the [[Sprite]] class, only that sprites implement the
 * [[ISprite]] interface. However, the [[Sprite]] class provides facilities
 * to ease the creation of objects that supply that interface; most
 * notably through the use of the [[Sprite.behaviors]] mechanism.
 */
export class Sprite implements ISprite {
    /** Sprite position. */
    lastPos : Point;
    /** Sprite position. */
    pos : Point = point();
    /** Sprite x and y speed. */
    vel : Velocity = veloc();
    /** X and y acceleration. */
    accel : Acceleration = accel();
    /** Sprite rotation in radians. */
    rotation : number = 0;

    autoRotate : boolean = true;

    body : IBody = body.none;

    /**
     * A list of behaviors that the sprite will have.
     * This is usually the most important member to override in
     * descendant classes of [[Sprite]].
     * 
     * The factory functions contained in this list are invoked
     * the first time that [[Sprite.update]]() is called, to
     * produce the real behaviors ([[IUpdatable]] objects)
     * that are used from then on to produce various effects
     * on update.
     */
    protected behaviors : IBehaviorFactory<this>[] | undefined = [];

    /**
     * The list of instantiated behaviors. The value is derived from `behaviors`
     * at the first [[Sprite.update]]() call.
     */
    protected behaviorsInst : IUpdatable[];

    /**
     * A factory to produce a drawable that will be used to draw this
     * sprite. Keeping it as a separate member makes it easier to
     * separate from the rest of the content, and maintain a declarative
     * style for Sprite descendant classes.
     */
    protected drawer : IDrawable;

    /**
     * A registry intended to be used as a publicly accessible
     * scratchpad space by behaviors.
     */
    protected reg : any

    constructor (public game : Game) {}

    /** Default implementation calls [[IUpdatable.update]] on the behaviors. */
    update(delta : Duration) : void {
        // Ugh. Wanted this to be in the constructor, but TypeScript (as
        // of 1.8.10) calls constructors before evaluating member
        // declarations, so there's no way to provide behaviors
        // before construction.
        this.lastPos = this.pos.clone();
        if (this.behaviors !== undefined) {
            this.behaviorsInst = this.behaviors.map(
                (x : IBehaviorFactory<this>) : IUpdatable => x(this.game, this)
            );
            this.behaviors = undefined;
        }
        this.behaviorsInst.forEach(
            (x : IUpdatable) => x.update(delta)
        );
    }

    /** Default implementation calls `drawer.draw()`. */
    draw(c : CanvasRenderingContext2D) : void {
        if (this.drawer !== undefined && this.drawer !== null) {
            this.drawer.draw(c);
        }
    }

    destroy() : void {
        let bs = this.behaviorsInst;
        while (bs.length > 0) {
            let b = bs.pop() as any | IDestroyable;
            if (isDestroyable(b))
                b.destroy();
        }
    }

    handleEvent(event : Event) : void {}
}
