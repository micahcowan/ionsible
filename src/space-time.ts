export class Timestamp {
    protected _stamp : number;

    constructor(protected stampIn : Date | Timestamp = new Date) {
        if (stampIn instanceof Timestamp) {
            // We were passed a Timestamp; resolve to underlying ms count.
            this._stamp = stampIn._stamp;
        }
        else {
            // We were passed a Date; resolve to an ms count.
            this._stamp = stampIn.valueOf();
        }
    }

    sub(t : Timestamp) : Duration {
        return new Duration(this._stamp - t._stamp);
    }
}

export class Duration {
    protected _ms : number;

    constructor(ms : Duration | number) {
        if (ms instanceof Duration) {
            // We were passed a Duration; resolve to underlying ms.
            this._ms = ms._ms;
        }
        else {
            this._ms = ms;
        }
    }

    get s() : number {
        return this._ms / 1000;
    }

    get ms() : number {
        return this._ms;
    }
}
