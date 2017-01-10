/**
 * Provides the `Game` class, which manages setting up and starting the
 * game.
 */
import { Timestamp, Duration, Point, point } from "./space-time"
import {
    ISprite
  , ISpriteContainer
  , IPositionedDrawable
  , IUpdatable
  , isSpriteContainer
} from "./sprite"
import { Rect, getXYWH } from "./shape";

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
      , parent?: string | HTMLElement
    } = {}) {
        let canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        if (id) canvas.id = id;

        let parentElem : HTMLElement; // Guaranteed to be element.
        if (parent === undefined) {
            parentElem = document.getElementsByTagName('body')[0];
        }
        else if (typeof parent == "string") {
            let parentStr = parent as string;
            if (parentStr.substring(0,1) == '#') {
                parentElem = document.getElementById(parentStr.substring(1));
            }
            else {
                throw "Ionsible: \"" + parentStr + "\" doesn't begin with a #.";
            }
        }
        else {
            parentElem = parent as HTMLElement;
        }

        parentElem.appendChild(canvas);

        this.canvas = canvas;
        this.context = canvas.getContext("2d");
    }

    /** Reference to the canvas element created at construction time. */
    public canvas : HTMLCanvasElement;

    /** Reference to the "2d" context obtained from `canvas`. */
    public context : CanvasRenderingContext2D;

    /** Center point on the camera. */
    public get center() : Point {
        return point(this.canvas.width/2, this.canvas.height/2);
    }

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

    /** The target framerate. */
    public fps : number = 50;

    /**
     * If more than this number of frames would be skipped since the
     * last update, we lock it to this number.
     */
    public maxFramesSkipped : number = 5;

    /**
     * If true, will draw the bounding boxes of sprites
     * (for debugging purposes).
     */
    public drawBB : boolean = false;

    private updateScene(scene : ISprite[], delta : Duration) {
        scene.forEach(
            (arg : IUpdatable & (any | ISpriteContainer)) => {
                arg.update(delta);
                if (isSpriteContainer(arg)) {
                    this.updateScene(arg.subsprites, delta);
                }
            }
        );
    }

    private drawScene(scene : IPositionedDrawable[],
                      c : CanvasRenderingContext2D) {
        scene.forEach(
            (arg : IPositionedDrawable & (any | ISpriteContainer)) => {
                c.beginPath();
                c.save();

                try {
                    // Translate
                    c.translate(arg.pos.x, arg.pos.y);

                    // Rotate
                    c.rotate(arg.rotation);

                    arg.draw(c);
                } finally {
                    // Restore
                    c.restore();
                }

                // Draw bounds
                if (this.drawBB) {
                    (<any[]>scene).forEach(
                        (arg : any) => {
                            let c = this.context;
                            if (!(arg.body && arg.body.bounds))
                                return;
                            c.save();

                            // Translate
                            c.translate(arg.pos.x, arg.pos.y);

                            c.lineWidth = 1;
                            c.strokeStyle = 'lime';
                            let {x, y, w, h} = getXYWH(<Rect>arg.body.bounds);
                            c.strokeRect(x, y, w, h);

                            // Restore
                            c.restore();
                        }
                    );
                }

                // Recurse
                if (isSpriteContainer(arg)) {
                    this.drawScene(arg.subsprites, c);
                }
            }
        );
    }

    /**
     * Begin the game, updating and drawing sprites.
     */
    start() : void {
        /* TODO: remove hardcoded delay in favor of calculated FPS. */
        /* TODO: implement a max delta. */
        let lastTime = new Timestamp;
        let scene = this.scene;
        setInterval(
            () => {
                let now = new Timestamp;
                let delta = now.sub(lastTime);
                lastTime = now;

                // Lock down the number of skipped frames.
                let maxDelta = new Duration(1000/this.fps * this.maxFramesSkipped)
                if (delta.ms > maxDelta.ms)
                    delta = maxDelta;

                // Updates
                if (!this.paused) {
                    this.elapsed = new Duration(this.elapsed.ms + delta.ms);
                    this.updateScene(scene, delta);
                }

                // Draw
                this.drawScene(scene, this.context);
            }
          , 1000 / this.fps
        );
    }
}
