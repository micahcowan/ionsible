/**
 * Primary module. Import this module to get all the others.
 *
 * If you're looking for a place to start reading, try the `game`
 * module (link on the right of this page).
 * 
 * Most submodules are imported into the general namespace; e.g..,
 * if you import `ionsible` like:
 * 
 * ```
 * import * as ion from "ionsible";
 * ```
 * 
 * You'll get most things under `ion`.
 * 
 * However, the contents of the `behavior`, `util`, and `body` submodules
 * would be available under `ion.b`, `ion.util`, and `ion.body`,
 * respectively.
 */

/** Useless docstring for "first declaration"" */
export * from "./space-time"
export * from "./game"
export * from "./sprite"
export * from "./shape"
export * from "./keys"

import * as b from "./behavior"
import * as util from "./util"
import * as body from "./body"

export { b, util, body }
