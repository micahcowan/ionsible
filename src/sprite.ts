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

/**
 * Sprites are both updated, and drawn to canvas, so ISprite combines
 * both features.
 */
export interface ISprite extends IDrawable, IUpdatable {
}

/**
 * A "factory function" that produces an `IUpdatable`.
 */
export interface IBehaviorFactory {
    (game : Game, sprite : Sprite) : IUpdatable;
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
    pos : Point = point();
    /** Sprite x and y speed. */
    vel : Velocity = veloc();
    /** X and y acceleration. */
    accel : Acceleration = accel();
    /** Sprite rotation in radians. */
    rotation : number = 0;

    autoRotate : boolean = true;

    /**
     * Draw Sprite to canvas.
     *
     * Empty definition: Must be overridden if you actually want to
     * draw something.
     */
    draw(context : CanvasRenderingContext2D) : void {
    }

    /**
     * A list of factories to initialize the members of `behaviors`.
     * This is usually the most important member to override in
     * descendant classes of `Sprite`.
     */
    protected behaviorsDef : IBehaviorFactory[] = [];

    /**
     * The list of behaviors. The value is derived from `behaviorsDef`
     * upon `Sprite` construction.
     */
    protected behaviors : IUpdatable[];

    /**
     * A registry intended to be used as a publicly accessible
     * scratchpad space by behaviors.
     */
    protected reg : any

    /**
     * Creates a new `Sprite` instance, and instanciates all the
     * behaviors from the `behaviorsDef` declaration.
     */
    constructor (public game : Game) {}

    /** Default implementation calls `.update` on the behaviors. */
    update(delta : Duration) : void {
        // Ugh. Wanted this to be in the constructor, but TypeScript (as
        // of 1.8.10) calls constructors before evaluating member
        // declarations, so there's no way to provide behaviorsDef
        // before construction.
        this.lastPos = this.pos.clone();
        if (this.behaviorsDef !== undefined) {
            this.behaviors = this.behaviorsDef.map(
                (x : IBehaviorFactory) : IUpdatable => x(this.game, this)
            );
            this.behaviorsDef = undefined;
        }
        this.behaviors.forEach(
            (x : IUpdatable) => x.update(delta)
        );
    }
}
