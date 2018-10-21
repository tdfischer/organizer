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
    } else if (typeof(haystack) == 'number') {
        return Number.parseFloat(needle) == haystack
    } else {
        return needle == haystack
    }
}

function floatCmp(func, value) {
    const asFloat = Number.parseFloat(value)
    return (row) => func(row, asFloat)
}

export const makeComparator = (obj) => {
    const {children, property, op, value} = obj || {}
    if (children == undefined) {
        if (property == undefined || op == undefined || value == undefined) {
            return () => true
        }
        switch (op) {
        case 'contains':
            return (row) => matchOrContains(value, _.get(row, property))
        case 'is':
            return (row) => isEqual(value, _.get(row, property))
        case 'gt':
            return floatCmp((row, asFloat) => _.get(row, property) > asFloat, value)
        case 'gte':
            return floatCmp((row, asFloat) => _.get(row, property) >= asFloat, value)
        case 'lt':
            return floatCmp((row, asFloat) => _.get(row, property) < asFloat, value)
        case 'lte':
            return floatCmp((row, asFloat) => _.get(row, property) <= asFloat, value)
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
