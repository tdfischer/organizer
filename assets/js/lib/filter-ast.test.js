import { matchPattern, makeComparator, matchOrContains, isEqual } from './filter-ast'

describe('isEqual', () => {
    it('should match two equal strings', () => {
        expect(isEqual('', '')).toEqual(true)
        expect(isEqual('foo', 'foo')).toEqual(true)
    })
    it('should not match two different strings', () => {
        expect(isEqual('foo', 'bar')).toEqual(false)
    })
    it('should match a string in an array of strings', () => {
        expect(isEqual('foo', [])).toEqual(false)
        expect(isEqual('foo', ['foobar'])).toEqual(false)

        expect(isEqual('foo', ['foo'])).toEqual(true)
        expect(isEqual('foo', ['foo', 'bar'])).toEqual(true)
        expect(isEqual('foo', ['bar', 'foo'])).toEqual(true)
    })
})

describe('matchOrContains', () => {
    it('should match two equal strings', () => {
        expect(matchOrContains('foo', 'foo')).toEqual(true)
        expect(matchOrContains('foo', 'bar')).toEqual(false)
    })
    it('should match a substring', () => {
        expect(matchOrContains('foo', 'bazfoobar')).toEqual(true)
        expect(matchOrContains('foo', 'bazbar')).toEqual(false)
    })
    it('should match two equal strings in an array', () => {
        expect(matchOrContains('foo', ['foo'])).toEqual(true)
        expect(matchOrContains('foo', ['bar'])).toEqual(false)
    })
    it('should match a substring in an array', () => {
        expect(matchOrContains('foo', ['bazfoobar'])).toEqual(true)
        expect(matchOrContains('foo', ['bazbar'])).toEqual(false)
    })
    it('should fail to match non-string haystacks', () => {
        expect(matchOrContains('foo', {})).toEqual(false)
    })
})

const pattern = (property, op, value) => ({property, op, value})

const joinPattern = (op, patterns) => ({children: patterns, op: op})
const testObject = {
    name: 'Full Name',
    tags: ['foo', 'bar', 'bazbiz']
}

describe('makeComparator', () => {
    describe('simple patterns', () => {
        it('should throw an error for an unknown operator', () => {
            var passed = false
            try {
                makeComparator(pattern('name', 'NOT AN OPERATOR', 'Not A Name'))
            } catch (Error) {
                passed = true
            }
            expect(passed).toEqual(true)
        })
        it('should always match without a property', () => {
            expect(makeComparator(pattern(undefined, 'is', 'Not A Name'))(testObject)).toEqual(true)
        })
        it('should always match without an operation', () => {
            expect(makeComparator(pattern('name', undefined, 'Not A Name'))(testObject)).toEqual(true)
        })
        it('should always match without a value', () => {
            expect(makeComparator(pattern('name', 'is', undefined))(testObject)).toEqual(true)
        })
        it('should equate two equal strings', () => {
            expect(makeComparator(pattern('name', 'is', 'Full Name'))(testObject)).toEqual(true)
        })
        it('should match a subset of a property', () => {
            expect(makeComparator(pattern('name', 'contains', 'Name'))(testObject)).toEqual(true)
        })
        it('should match a string in an array property', () => {
            expect(makeComparator(pattern('tags', 'is', 'foo'))(testObject)).toEqual(true)
        })
        it('should match a subset of a string in an array property', () => {
            expect(makeComparator(pattern('tags', 'contains', 'biz'))(testObject)).toEqual(true)
        })
    })

    describe('compound patterns', () => {
        describe('one level of depth', () => {
            it('should equate two equal strings', () => {
                expect(makeComparator(joinPattern('and', [pattern('name', 'is', 'Full Name')]))(testObject)).toEqual(true)
                expect(makeComparator(joinPattern('or', [pattern('name', 'is', 'Full Name')]))(testObject)).toEqual(true)
            })
            it('should not equate two different strings', () => {
                expect(makeComparator(joinPattern('and', [pattern('name', 'is', 'Not The Name')]))(testObject)).toEqual(false)
                expect(makeComparator(joinPattern('or', [pattern('name', 'is', 'Not The Name')]))(testObject)).toEqual(false)
            })
            it('should match a subset of a property', () => {
                expect(makeComparator(joinPattern('and', [pattern('name', 'contains', 'Name')]))(testObject)).toEqual(true)
                expect(makeComparator(joinPattern('or', [pattern('name', 'contains', 'Name')]))(testObject)).toEqual(true)
            })
            it('should match a string in an array property', () => {
                expect(makeComparator(joinPattern('and', [pattern('tags', 'is', 'foo')]))(testObject)).toEqual(true)
                expect(makeComparator(joinPattern('or', [pattern('tags', 'is', 'foo')]))(testObject)).toEqual(true)
            })
            it('should match a subset of a string in an array property', () => {
                expect(makeComparator(joinPattern('and', [pattern('tags', 'contains', 'biz')]))(testObject)).toEqual(true)
                expect(makeComparator(joinPattern('or', [pattern('tags', 'contains', 'biz')]))(testObject)).toEqual(true)
            })
        })

        describe('multiple patterns joined', () => {
            it('AND should match if all patterns match', () => {
                const joined = joinPattern('and', [
                    pattern('tags', 'contains', 'biz'),
                    pattern('name', 'is', 'Full Name'),
                ])
                expect(makeComparator(joined)(testObject)).toEqual(true)
            })
            it('AND should not match if one failing property is joined with AND', () => {
                const joined = joinPattern('and', [
                    pattern('tags', 'contains', 'biz'),
                    pattern('name', 'is', 'Not The Name'),
                ])
                expect(makeComparator(joined)(testObject)).toEqual(false)
            })
            it('OR should match with one matching property, one non-matching property', () => {
                const joined = joinPattern('or', [
                    pattern('tags', 'contains', 'biz'),
                    pattern('name', 'is', 'Not The Name'),
                ])
                expect(makeComparator(joined)(testObject)).toEqual(true)
            })
            it('OR should not match with zero matching properties', () => {
                const joined = joinPattern('or', [
                    pattern('tags', 'is', 'biz'),
                    pattern('name', 'is', 'Not The Name'),
                ])
                expect(makeComparator(joined)(testObject)).toEqual(false)
            })
        })
    })
})

describe('matchPattern', () => {
    it('should match a matching pattern', () => {
        const joined = joinPattern('or', [
            pattern('tags', 'contains', 'biz'),
            pattern('name', 'is', 'Not The Name'),
        ])
        expect(matchPattern(testObject, joined)).toEqual(true)
    })
    it('should not match a non-matching pattern', () => {
        const joined = joinPattern('and', [
            pattern('tags', 'contains', 'biz'),
            pattern('name', 'is', 'Not The Name'),
        ])
        expect(matchPattern(testObject, joined)).toEqual(false)
    })
})
