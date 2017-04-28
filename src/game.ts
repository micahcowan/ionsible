/**
 * Provides the `Game` class, which manages setting up and starting the
 * game.
 */
/** useless import docstring */
import { Timestamp, Duration, Point, point } from "./space-time"
import {
    ISprite
  , ISpriteContainer
  , IPositionedDrawable
  , IUpdatable
  , isSpriteContainer
  , isISprite
  , isUpdatable
  , isPositionedDrawable
} from "./sprite"
import { Rect, getXYWH } from "./shape";

/** The type of thing that is allowed in a [[Scene]]. */
export type SceneElement = ISprite | ISpriteContainer;

/** Specifies a set of objects to draw and update ([[SceneElement]]s). */
export type Scene = SceneElement[];

/**
 * Responsibilities:
 * - Set up of canvas element for game display
 * - Maintain core game configuration (such as FPS), state (such as
 *   paused/not paused, or elapsed game time),
 *   and other publicly accessible objects tied
 *   single game instances.
 * - Maintain a registry of sprites ([[ISprite]]), to update and/or display
 */
export class Game {
    /**
     * Constructs a new [[Game]], creating an `HTMLCanvasElement` and
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

        let parentElem : HTMLElement | null; // Guaranteed to be element.
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

        if (parentElem === null) {
            throw "Ionsible: Couldn't find parent element for canvas.";
        }
        parentElem.appendChild(canvas);

        this.canvas = canvas;

        this.camera = new Camera(this, canvas);
    }

    /** Reference to the canvas element created at construction time. */
    public canvas : HTMLCanvasElement;

    /** The primary camera for rendering to canvas. */
    public camera : ICamera;

    /** Center point of the canvas. */
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
     * During paused state, the game continues to call `.draw()` ([[IDrawable.draw]]) for all
     * sprites, but will no longer call `.update()` ([[IUpdatable.update]]) until the game is
     * unpaused again.
     */
    public paused : boolean = false;

    /** Pause the game. */
    pause()       : void { this.paused = true; }
    /** Unpause the game. */
    unpause()     : void { this.paused = false; }
    /** Toggle the paused state of the game. */
    togglePause() : void { this.paused = !this.paused; }

    private scene : Scene;

    /**
     * Sets the active sprites to update and draw.
     *
     * **Warning**: Do not share sprite objects amongst multiple scenes
     * (arrays of sprites) unless you want them to update across all
     * scenes. Always use separate instances to avoid this.
     */
    setScene(scene : Scene) {
        this.scene = scene;
    }

    /** The target framerate. */
    public fps : number = 50;

    /**
     * If more than this number of frames would be skipped since the
     * last update, we lock it to this number.
     */
    public maxFramesSkipped : number = 5;

    private updateScene(scene : Scene, delta : Duration) {
        scene.forEach(
            (arg : SceneElement) => {
                if (isUpdatable(arg)) {
                    arg.update(delta);
                }
                if (isSpriteContainer(arg)) {
                    this.updateScene(arg.subsprites, delta);
                }
            }
        );

        // Camera update
        this.camera.update(delta);
    }

    /**
     * Begin the game, updating and drawing sprites.
     */
    start() : void {
        /* TODO: remove hardcoded delay in favor of calculated FPS. */
        /* TODO: implement a max delta. */
        let lastTime = new Timestamp;
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
                    this.updateScene(this.scene, delta);
                }

                // Draw
                this.camera.render(this.scene);
            }
          , 1000 / this.fps
        );
    }
}

/** Interface for cameras that can render a scene (list of sprites/drawable objects) */
export interface ICamera extends IUpdatable {
    /** The camera's center position. */
    pos : Point;

    /** The camera's rotation (in radians). */
    rotation : number;

    /** A constant scale */
    scale : number;

    /** The canvas to which scenes shall be rendered. */
    readonly canvas : HTMLCanvasElement;

    /** The renderin contexgt of the canvas. */
    readonly context : CanvasRenderingContext2D;

    /** Render a scene of objects, after adjusting for camera position and rotation. */
    render(scene : Scene) : void;
}

/** A concrete implementation of [[ICamera]] */
export class Camera implements ICamera {
    public pos : Point = point(0, 0);
    public rotation : number = 0;
    public context : CanvasRenderingContext2D;
    public scale : number = 1;

    constructor(public game : Game, public canvas : HTMLCanvasElement) {
        let context = canvas.getContext("2d");
        if (context === null) {
            throw "Ionsible: Could not obtain 2D drawing context from canvas.";
        }
        this.context = context;
    }

    /**
     * If true, will draw the bounding boxes of sprites
     * (for debugging purposes).
     */
    public drawBB : boolean = false;

    /**
     * Draw all objects in the scene to the canvas.
     */
    public render(scene : Scene) {
        let c = this.context;

        // Adjust canvas for camera position and rotation.
        //    First, save the current canvas state:
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.save();

        //    Next, set up coords so origin is in canvas center, and y axis goes upward
        //    (standard cartesian format)
        c.translate(this.canvas.width/2, this.canvas.height/2);
        //c.scale(1, -1);

        if (this.scale != 1)
            c.scale(this.scale, this.scale);

        if (this.rotation != 0)
            c.rotate(-this.rotation);

        //    Now do the actual camera fixes.
        if (true && (this.pos.x != 0 || this.pos.y != 0))
            c.translate(-this.pos.x, -this.pos.y);

        // Now, draw each scene element.
        scene.forEach(
            (arg : SceneElement) => {
                c.beginPath();

                if (isPositionedDrawable(arg)) {
                    c.save();
                    try {
                        // Translate
                        if (arg.pos.x != 0 || arg.pos.y != 0) {
                            c.translate(arg.pos.x, arg.pos.y);
                        }

                        // Rotate
                        if (arg.rotation != 0) {
                            c.rotate(arg.rotation);
                        }

                        arg.draw(c);
                    } finally {
                        // Restore
                        c.restore();
                    }

                    // Draw bounds
                    if (this.drawBB) {
                        // XXX: Ew.
                        (<any[]>scene).forEach(
                            (arg : any) => {
                                if (!(arg.body && arg.body.bounds))
                                    return;
                                c.save();

                                try {
                                    // Translate
                                    c.translate(arg.pos.x, arg.pos.y);

                                    c.lineWidth = 1;
                                    c.strokeStyle = 'lime';
                                    let {x, y, w, h} = getXYWH(<Rect>arg.body.bounds);
                                    c.strokeRect(x, y, w, h);
                                }
                                finally {
                                    // Restore
                                    c.restore();
                                }
                            }
                        );
                    }
                }

                // Recurse
                if (isSpriteContainer(arg)) {
                    c.save()
                    try {
                        // Is this the best way to do this? Need to restore
                        // identity matrix. Could be other things I'd need to restore too...
                        c.setTransform(1, 0, 0, 1, 0, 0);
                        this.render(arg.subsprites);
                    }
                    finally {
                        c.restore();
                    }
                }
            }
        );

        // Restore canvas to pre-camera adjustments.
        c.restore();
    }

    /**
     * Default implementation does nothing.
     */
    update(delta : Duration) {}
}