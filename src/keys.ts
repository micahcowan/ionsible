/**
 * Keys exports just the single default export, the [[Keys]] class.
 */

/**
 * Class provides a convenient interface to checking for keypresses, and
 * in particular, checking whether given keypresses have taken place
 * since last time we polled for them.
 */
export class Keys {
    /**
     * A mapping of key names, and associated handlers.
     * Called on [[Keys.pulse]]; see the [[Keys.connect]] method.
     */
    private connections : KeyHandlerMap = {};

    /**
     * A mapping of key names, and associated handlers,
     * called when the key is pressed.
     *
     * The handlers are registered via [[Keys.onDown]]`.
     */
    private downs       : KeyHandlerMap = {};

    /**
     * A mapping of key names, and associated handlers,
     * called when the key is lifted.
     *
     * The handlers are registered via [[Keys.onUp]].
     */
    private ups         : KeyHandlerMap = {};

    /**
     * Tracks which keys are currently pressed, based on whether we've
     * seen a `keydown` without a subsequent `keyup`.
     */
    private keys        : KeySet = {};

    /**
     * Used to hold a reference to an [[ActionSet]] currently being
     * constructed from a call to [[Keys.pulse]]().
     */
    private actionTracker : ActionSet;

    /**
     * Constructs a new [[Keys]] object, registering internal key event
     * handlers.
     */
    constructor(private target : EventTarget = window) {
        this.target.addEventListener('keydown', this.handleKeyDown);
        this.target.addEventListener('keyup', this.handleKeyUp);
    }

    /**
     * Destroys the object, deregistering internal key event
     * handlers.
     */
    public destroy() : void {
        this.target.removeEventListener('keydown', this.handleKeyDown);
        this.target.removeEventListener('keyup', this.handleKeyUp);
    }

    /**
     * Connects keys to handlers. These handlers are called neither on
     * `keyUp`, nor on `keyDown`, but upon an invocation of [[Keys.pulse]]()
     * occurring while the associated key is pressed.
     */
    public connect(key : string, handler : () => void) : void {
        this.connections[key] = handler;
    }

    /**
     * Register an association for a number of keys, to string labels.
     * Then, when [[Keys.pulse]]() is called, it will return the set of string
     * labels that have been associated with keys that are currently
     * pressed.
     */
    public actions(actions : ActionKeysMap) : void {
        Object.keys(actions).forEach(label => {
            let a : string|string[] = actions[label]
            let keyList : string[]
            keyList = (a instanceof Array)? a : [a];

            keyList.forEach(a => {
                this.connect(a, () => {
                    this.actionTracker[label] = true;
                });
            });
        });
    }

    /** Register a handler for keydown. */
    public onDown(key : string | string[], handler : KeyHandler) : void {
        let keys : string[] =
            (typeof key === 'string')?  [<string>key] : <string[]>key;
        keys.forEach(k => {
            this.downs[k] = handler;
        });
    }

    /** Register a handler for keyup. */
    public onUp(key : string | string[], handler : KeyHandler) : void {
        let keys : string[] =
            (typeof key === 'string')?  [<string>key] : <string[]>key;
        keys.forEach(k => {
            this.ups[k] = handler;
        });
    }

    /**
     * Key handler to register with the target, and deregister on
     * destruction. It is _not_ a method, but a member field whose value
     * is a function.
     *
     * Marks the given key as currently pressed (adding it to the
     * `keys` set), and calls any handlers registered via [[Keys.onDown]]().
     *
     * Will prevent the event from triggering the default behavior,
     * unless a modifier key accompanied it.
     */
    private handleKeyDown
            : (ev : KeyboardEvent) => void
            = (ev) => {
        // This being an arrow function, created in the constructor,
        // `this` is bound to the Keys instance.
        let keys = this.getKeys(ev);
        keys.forEach(k => {
            this.keys[k] = true;
            if (this.downs[k] !== undefined) {
                (this.downs[k])(ev);
            }
        });

        this.maybeContinue(keys, ev);
    }

    /**
     * Key handler to register with the target, and deregister on
     * destruction. It is _not_ a method, but a member field whose value
     * is a function.
     *
     * Unmarks the given key as currently pressed (removing it from
     * the `keys` set), and calls any handlers registered via
     * [[Keys.onUp]]().
     *
     * Will prevent the event from triggering the default behavior,
     * unless a modifier key accompanied it.
     */
    private handleKeyUp
            : (ev : KeyboardEvent) => void
            = (ev) => {
        // This being an arrow function, created in the constructor,
        // `this` is bound to the Keys instance.
        let keys = this.getKeys(ev);
        keys.forEach(k => {
            delete this.keys[k];
            if (this.ups[k] !== undefined) {
                (this.ups[k])(ev);
            }
        });

        this.maybeContinue(keys, ev);
    }

    /**
     * Conditionally prevents further downstream processing of a key,
     * if modifier keys (like control or command) are involved.
     */
    public maybeContinue(keys : string[], e : KeyboardEvent) {
        if (!(e.altKey || e.ctrlKey || e.metaKey)) {
            e.preventDefault();
        }
    }

    /**
     * Return a full listing of likely names for a given key event, so
     * that a user might associate any of these names with an event
     * handler, without concern as to which name was appropriate for a
     * given browser implementation.
     */
    public getKeys(e : KeyboardEvent) : string[] {
        let key;
        if (e.key !== undefined) {
            key = e.key;
        }
        else if ((<any>e).keyIdentifier !== undefined) {
            // Older, deprecated field that sometimes acts like `e.key`,
            // and in other cases gives a unicode codepoint
            // representation of the character represented by the key.
            key = (<any>e).keyIdentifier;
            if (key.substr(0,4) == 'U+00' && key.length == 6) {
                key = String.fromCharCode(parseInt('0x' + key.substr(4,2)));
            }
        }

        let keys = [];
        if (key == ' ' || key == 'Space' || key == 'Spacebar') {
            keys.push(' ');
            keys.push('Space');
            keys.push('Spacebar');
        }
        else if (key == 'Up' || key == 'Down' || key == 'Left'
                 || key == 'Right') {
            keys.push(key);
            keys.push('Arrow' + key);
        }
        else if (key == 'ArrowUp' || key == 'ArrowDown' || key == 'ArrowLeft'
                 || key == 'ArrowRight') {
            keys.push(key.substr(5));
            keys.push(key);
        }
        else if (key == 'Esc' || key == 'Escape') {
            keys.push('Esc');
            keys.push('Escape');
        }
        else if (key == 'Del' || key == 'Delete') {
            keys.push('Del');
            keys.push('Delete');
        }
        else if (key.length == 1 && key.toLowerCase() != key.toUpperCase()) {
            keys.push(key.toLowerCase());
            keys.push(key.toUpperCase());
        }
        else {
            keys.push(key);
        }
        return keys;
    }

    /**
     * Return the labels for the sets of keys registered via [[Keys.actions]](),
     * corresponding to keys that are currently pressed.
     */
    public pulse() : ActionSet {
        this.actionTracker = {};
        for (let key in this.keys) {
            let conn = this.connections[key];
            if (conn !== undefined && conn !== null) {
                conn();
            }
        }
        return this.actionTracker;
    }
}

/** A callback function used when a key has been pressed. */
export interface KeyHandler {
    (ev? : KeyboardEvent): any;
}

// private
/**
 * A mapping of keys (via string name) to handlers.
 *
 * Not a true `Map` instance: ordinary JS object for ES5 compatibility.
 */
type KeyHandlerMap = {[key: string] : KeyHandler};

// private
/**
 * Set of keys (via string name).
 *
 * Not a true `Set` instance: ordinary JS object for ES5 compatibility.
 */
type KeySet = {[key: string] : boolean};

/**
 * An association of string labels, to lists of key names.
 * 
 * Not a true `Map` instance, but an ordinary JavaScript object mapping
 * (for compatibility with ES5 and prior).
 *
 * When only a single key is associated with a given label, that key's
 * name may be specified directly, instead of in an array.
 */
export type ActionKeysMap = { [label: string] : string[] | string }

/**
 * A set of string labels, returned by [[Keys.pulse]](),
 * reflecting a group of keys, one of which is
 * currently pressed.
 *
 * Not a true `Set` instance, but an object, for compatibility with ES 5
 * and older.
 */
export type ActionSet = { [label: string] : boolean }
