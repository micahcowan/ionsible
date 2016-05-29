/**
 * Provides the `Sprite` class, and various related interfaces.
 */

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
     * Whether rotation should be applied before the game calls our
     * `.draw()` method.
     */
    autoRotate: boolean;
}

/**
 * Interface for things that are updated by the game.
 */
export interface IUpdatable {
    /**
     * Updates sprite state (usually, position and such)
     *
     * Normally, the implementation in the Sprite class should be used,
     * and behavior should be overridden via the `.behaviors` field.
     */
    update(delta: Duration) : void;
}

export interface IDestroyable {
    destroy() : void;
}

export function isDestroyable(b : any | IDestroyable) : b is IDestroyable {
    return (b.destroy !== undefined && b.destroy !== null);
}

/**
 * Sprites are both updated, and drawn to canvas, so ISprite combines
 * both features.
 */
export interface ISprite extends IPositionedDrawable, IUpdatable, IDestroyable {
}

/**
 * A "factory function" that produces an `IUpdatable`.
 */
export interface IBehaviorFactory {
    (game : Game, sprite : Sprite) : IUpdatable;
}

/**
 * A "factory function" that produces an `IDrawable`.
 */
export interface IDrawableFactory {
    (game : Game, sprite : Sprite) : IDrawable;
}

/**
 * The `Sprite` class. The top-level `Game` object neither knows nor
 * cares about the `Sprite` class, just objects that implement the
 * `ISprite` interface. However, the `Sprite` class provides facilities
 * to ease the creation of objects that supply that interface; most
 * notably through the use of the `behaviors` mechanism.
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
     * descendant classes of `Sprite`.
     */
    protected behaviors : IBehaviorFactory[] = [];

    /**
     * The list of instantiated behaviors. The value is derived from `behaviors`
     * upon `Sprite` construction.
     */
    protected behaviorsInst : IUpdatable[];

    /**
     * A factory to produce a drawable that will be used to draw this
     * sprite. Keeping it as a separate member makes it easier to
     * separate from the rest of the content, and maintain a declarative
     * style for Sprite descendant classes.
     */
    protected drawer : IDrawableFactory;

    /**
     * The instantiated drawer.
     */
    protected drawerInst : IDrawable;

    /**
     * A registry intended to be used as a publicly accessible
     * scratchpad space by behaviors.
     */
    protected reg : any

    /**
     * Creates a new `Sprite` instance, and instanciates all the
     * behaviors from the `behaviors` declaration.
     */
    constructor (public game : Game) {}

    /** Default implementation calls `.update` on the behaviors. */
    update(delta : Duration) : void {
        // Ugh. Wanted this to be in the constructor, but TypeScript (as
        // of 1.8.10) calls constructors before evaluating member
        // declarations, so there's no way to provide behaviors
        // before construction.
        this.lastPos = this.pos.clone();
        if (this.behaviors !== undefined) {
            this.behaviorsInst = this.behaviors.map(
                (x : IBehaviorFactory) : IUpdatable => x(this.game, this)
            );
            this.behaviors = undefined;
        }
        this.behaviorsInst.forEach(
            (x : IUpdatable) => x.update(delta)
        );
    }

    /** Default implementation calls `drawerInst.draw`. */
    draw(c : CanvasRenderingContext2D) : void {
        // Ugh. Wanted this to be in the constructor, but TypeScript (as
        // of 1.8.10) calls constructors before evaluating member
        // declarations, so there's no way to provide the drawer
        // before construction.
        if (this.drawer !== undefined) {
            this.drawerInst = this.drawer(this.game, this);
            this.drawer = undefined;
        }
        else if (this.drawerInst !== undefined) {
            this.drawerInst.draw(c);
        }
    }

    destroy() : void {
        this.behaviorsInst.forEach(
            (b : any | IDestroyable) => {
                if (isDestroyable(b)) {
                    b.destroy();
                }
            }
        );
    }
}
