/**
 * Primary module. Import this module to get all the others.
 *
 * If you're looking for a place to start reading, try the `./game`
 * module.
 */

export * from "./space-time"
export * from "./game"
export * from "./sprite"
export * from "./shape"

import * as b from "./behavior"
import * as util from "./util"
import * as body from "./body"

export { b, util, body }
