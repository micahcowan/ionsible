/**
 * Provides a number of update behaviors that are useful for game sprites.
 *
 * These are exported as `b`, so if you import ionsible like:
 *
 *     import * as Ion from "ionsible"
 *
 * Then you would refer to the behavior `Momentum` in this module as
 * `Ion.b.Momentum`.
 */
import { IUpdatable, IBehaviorFactory, Sprite } from "./sprite"
import { Game } from "./game"
import { Duration } from "./space-time"

// The following variable exists only to verify at
// compile-time that the constructor of
// each of the classes below, implement IBehaviorFactory.
let factory : IBehaviorFactory;

/**
 * Convenience base class for behaviors, which saves away the required
 * `game` and `sprite` arguments.
 */
export class Behavior {
    constructor(protected game : Game, protected sprite: Sprite) {}
}

/**
 * Advances the sprite's `pos` by `vel` at each tick.
 * Does _not_ advance `vel` by `accel`.
 */
export class Momentum extends Behavior implements IUpdatable {
    update(delta : Duration) {
        this.sprite.pos = this.sprite.pos.advance(this.sprite.vel, delta);
    }
}
factory = Momentum;
