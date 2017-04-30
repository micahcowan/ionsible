/**
 * Provides basic event interfaces, compatible with, but not completely including,
 * the standardized DOM interfaces for events.
 * 
 * Among other things, event propogation isn't currently implemented (though there
 * is room for the user to do so in their classes). It's primarily here to
 * provide basic subscriptions to things that can happen in the game (like collisions).
 */

/** Useless docstring for import. */
import { Duration } from "./space-time";

export type Event = any; // In case we want to tighten it down to an appropriate interface.

/**
 * Basic EventTarget interface.
 */
export interface IEventTarget {
    dispatchEvent(event : Event) : boolean;
}

/**
 * Basic EventListener interface.
 */
export interface IEventListener {
    handleEvent(event : Event) : void;
}

export class KeyHandlerEvent {
    constructor(public token : any, public delta : Duration) {
    }
}