export default class Breakpoint {
    constructor(breakpoints) {
        this.breakpoints = breakpoints
    }

    get(value) {
        return this.breakpoints.filter(breakpoint =>
            value <= breakpoint[0] || breakpoint[0] == undefined
        )[0]
    }

    getPoint(value) {
        return this.get(value)[0]
    }

    getValue(value) {
        return this.get(value)[1]
    }
}
