/**
 * Provides the `Game` class, which manages setting up and starting the
 * game.
 */
import { Timestamp, Duration } from "./space-time"
import { ISprite, IDrawable, IUpdatable } from "./sprite"

/**
 * Responsibilities:
 * - Set up of canvas element for game display
 * - Maintain core game configuration (such as FPS), state (such as
 *   paused/not paused, or elapsed game time),
 *   and other publicly accessible objects tied
 *   single game instances.
 * - Maintain a registry of Sprite objects, to update and/or display
 */
export class Game {
    /**
     * Constructs a new Game, creating an HTMLCanvasElement and
     * inserting it into the current document. Arguments are provided
     * via a single JS object, simulating keyword args.
     *
     * @param width The width of the canvas element. Defaults to 800.
     * @param height The height of the canvas element. Defaults to 600.
     * @param id The `id` attribute of the canvas element (default
     * "ionsible")
     * @param parent The HTMLElement to which the canvas element will be
     * appended. Defaults to the document body.
     */
    constructor({width = 800, height = 600, id = "ionsible", parent} : {
        width? : number
      , height? : number
      , id?: string
      , parent?: HTMLElement
    } = {}) {
        let canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        if (id) canvas.id = id;

        if (parent === undefined) {
            parent = document.getElementsByTagName('body')[0];
        }

        parent.appendChild(canvas);

        this.canvas = canvas;
        this.context = canvas.getContext("2d");
    }

    /** Reference to the canvas element created at construction time. */
    public canvas : HTMLCanvasElement;

    /** Reference to the "2d" context obtained from `canvas`. */
    public context : CanvasRenderingContext2D;

    /**
     * The total time that has elapsed during the game (not counting
     * paused time).
     */
    public elapsed : Duration = new Duration(0);

    /**
     * The paused/not paused status of the game.
     *
     * During paused state, the game continues to call `.draw()` for all
     * sprites, but will no longer call `.update()` until the game is
     * unpaused again.
     */
    public paused : boolean = false;

    /** Pause the game. */
    pause()       : void { this.paused = true; }
    /** Unpause the game. */
    unpause()     : void { this.paused = false; }
    /** Toggle the paused state of the game. */
    togglePause() : void { this.paused = !this.paused; }

    private scene : ISprite[];
    /**
     * Sets the active sprites to update and draw.
     *
     * **Warning**: Do not share sprite objects amongst multiple scenes
     * (arrays of sprites) unless you want them to update across all
     * scenes. Always use separate instances to avoid this.
     */
    setScene(scene : ISprite[]) {
        this.scene = scene;
    }

    /**
     * Begin the game, updating and drawing sprites.
     */
    start() : void {
        /* TODO: remove hardcoded delay in favor of calculated FPS. */
        /* TODO: implement a max delta. */
        let lastTime = new Timestamp;
        let scene = this.scene;
        let self = this;
        setInterval(
            () => {
                let now = new Timestamp;
                let delta = now.sub(lastTime);
                lastTime = now;

                // Updates
                scene.forEach(
                    (arg : IUpdatable) => arg.update(delta)
                );

                // Draw
                scene.forEach(
                    (arg : IDrawable) => {
                        let c = self.context;
                        c.beginPath();
                        c.save();

                        // Translate
                        c.translate(arg.pos.x, arg.pos.y);

                        arg.draw(c);

                        // Restore
                        c.restore();
                    }
                );
            }
          , 20
        );
    }
}
