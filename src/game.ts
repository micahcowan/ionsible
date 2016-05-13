export class Game {
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
    }
}
