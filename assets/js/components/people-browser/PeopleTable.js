import React from 'react'
import PropTypes from 'prop-types'
import ImmutablePropTypes from 'react-immutable-proptypes'
import _ from 'lodash'
import { connect } from 'react-redux'
import Chip from '@material-ui/core/Chip'
import { withStyles } from '@material-ui/core/styles'
import Checkbox from '@material-ui/core/Checkbox'
import { WindowScroller, Column, Table } from 'react-virtualized'

import 'react-virtualized/styles.css'

import { Model, Filterable, Selectable, withModelData } from '../../store'

const matchOrContains = (needle, haystack) => {
    if (typeof(haystack) == 'string') {
        return haystack.match(needle)
    } else if (haystack instanceof Array) {
        return _.reduce(haystack, (acc, stack) => acc || matchOrContains(needle, stack), false)
    } else {
        return false
    }
}

const isEqual = (needle, haystack) => {
    if (typeof(haystack) == 'string') {
        return haystack == needle
    } else if (haystack instanceof Array) {
        return haystack.indexOf(needle) != -1
    } else {
        return false
    }
}

const makeComparator = ({property, op, value}) => {
    if (property == undefined) {
        return () => true
    }
    switch (op) {
    case 'contains':
        return (row) => matchOrContains(value, _.get(row, property))
    case 'is':
        return (row) => isEqual(value, _.get(row, property))
    case undefined:
        return () => true
    default:
        throw Error('Unknown operator ' + op)
    }
}

const makePatternMatcher = _.memoize(patterns => {
    const comparators = _.map(patterns, makeComparator)
    return obj => _.reduce(comparators, (acc, comparator) => acc && comparator(obj), true)
}, patterns => _.flatMap(patterns, p => [p.property, p.op, p.value]).join('.'))

const matchPattern = (obj, patterns) => {
    return makePatternMatcher(patterns)(obj)
}

const People = new Model('people')
const PeopleSelector = new Selectable('people')
const PeopleFilter = new Filterable('people', matchPattern)

const TagList = props => (
    _.map(props.tags, tag => <Chip key={tag} className="tag" label={tag} />)
)

const rowStyles = {
    row: {
        height: '48px',
        display: 'table-row',
        verticalAlign: 'middle',
        margin: 0
    }
}

const PersonRow = withStyles(rowStyles)(props => (
    <div role="row" className={props.classes.row}>
        <div className={props.classes.cell}>
            <Checkbox checked={props.person.selected} onChange={() => props.selector.toggle(props.person.email)}/>
        </div>
        <div className={props.classes.cell}>{props.person.name} <TagList tags={props.person.tags} /></div>
        <div className={props.classes.cell}>{props.person.email}</div>
    </div>
))

PersonRow.propTypes = {
    person: PropTypes.object.isRequired,
    selector: PropTypes.object.isRequired,
}

const renderCheckboxCell = props => (
    <Checkbox checked={props.rowData.selected} onChange={() => props.selector.toggle(props.rowData.email)}/>
)

const renderCheckboxHeader = props => (
    <Checkbox checked={props.people.reduce((prev, person) => prev && person.selected, true)} onChange={(_e, newValue) => props.people.map(_.property('email')).forEach(newValue ? props.selector.add : props.selector.remove)} />
)

export const PeopleTable = props => (
    <WindowScroller scrollElement={document.getElementById('viewport')}>
        {({height, width, isScrolling, onChildScroll, scrollTop}) => (
            <Table
                autoHeight
                height={height}
                isScrolling={isScrolling}
                onScroll={onChildScroll}
                scrollTop={scrollTop}
                rowCount={props.filteredPeople.size}
                rowHeight={48}
                rowClassName={props.classes.row}
                rowGetter={({index}) => props.filteredPeople.get(index)}
                headerHeight={48}
                width={width}>
                <Column headerRenderer={() => renderCheckboxHeader({selector: props.selector, people: props.filteredPeople})} className={props.classes.checkboxCell} width={32} label='' dataKey='selected' cellRenderer={p => renderCheckboxCell({selector: props.selector, ...p})} />
                <Column className={props.classes.cell} width={(width/3*2)-32} label='Name' dataKey='name' />
                <Column className={props.classes.cell} width={(width/3)-32} label='Email' dataKey='email' />
            </Table>
        )}
    </WindowScroller>
)

const mapStateToProps = (state, _props) => {
    // Select all people with this state
    const allPeople = People.immutableSelect(state)
    const myPeople = PeopleFilter.filtered(state, allPeople).cacheResult()

    // Grab list of selected IDs
    const selection = PeopleSelector.immutableSelected(state).filter(myPeople.has).toList()

    // Apply filters
    const filteredPeople = PeopleFilter.filtered(state, myPeople)
        .map(person => ({...person, selected: selection.contains(person.email)}))
        .toIndexedSeq()
        .cacheResult()

    return {
        filteredPeople,
    }
}

const mapDispatchToProps = dispatch => {
    return {
        selector: PeopleSelector.bindActionCreators(dispatch),
    }
}


PeopleTable.propTypes = {
    filteredPeople: ImmutablePropTypes.seq.isRequired,
}

const mapPropsToModels = _props => {
    return {
        people: {}
    }
}

const styles = {
    cell: {
        display: 'table-cell',
        verticalAlign: 'inherit',
        padding: '4px 56px 4px 24px',
        marginRight: '0 !important'
    },
    row: {
        borderBottom: '1px solid rgb(224, 224, 224)',
    },
    checkboxCell: {
        display: 'table-cell',
        verticalAlign: 'inherit',
        padding: '4px 14px 4px 0px',
        marginRight: '0 !important'
    }
}

export default withStyles(styles)(connect(mapStateToProps, mapDispatchToProps)(withModelData(mapPropsToModels)(PeopleTable)))
