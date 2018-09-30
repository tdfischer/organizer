import _ from 'lodash'

export const matchOrContains = (needle, haystack) => {
    if (typeof(haystack) == 'string') {
        return haystack.indexOf(needle) != -1
    } else if (haystack instanceof Array) {
        return _.find(haystack, stack => matchOrContains(needle, stack)) != undefined
    } else {
        return false
    }
}

export const isEqual = (needle, haystack) => {
    if (haystack instanceof Array) {
        return haystack.indexOf(needle) != -1
    } else {
        return needle == haystack
    }
}

export const makeComparator = ({children, property, op, value}) => {
    if (children == undefined) {
        if (property == undefined || op == undefined || value == undefined) {
            return () => true
        }
        switch (op) {
        case 'contains':
            return (row) => matchOrContains(value, _.get(row, property))
        case 'is':
            return (row) => isEqual(value, _.get(row, property))
        default:
            throw Error('Unknown operator ' + op)
        }
    } else {
        const comparators = _.map(children, makeComparator)
        if (op == 'and') {
            // Run through each comparator, returning the first one that is
            // false; if one such comparator exists (find doesn't return
            // undefined), fail the match
            return obj => (_.find(comparators, comparator => !comparator(obj)) == undefined)
        } else if (op == 'or') {
            // Run through each comparator, returning the first one that is
            // true; if no such comparator exists (find returns undefined), fail
            // the match
            return obj => (_.find(comparators, comparator => comparator(obj)) != undefined)
        }
    }
}

export const matchPattern = (obj, pattern) => {
    return makeComparator(pattern)(obj)
}
