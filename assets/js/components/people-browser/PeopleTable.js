import React from 'react'
import ImmutablePropTypes from 'react-immutable-proptypes'
import _ from 'lodash'
import { connect } from 'react-redux'
import Chip from '@material-ui/core/Chip'
import Typography from '@material-ui/core/Typography'
import { withStyles } from '@material-ui/core/styles'
import Checkbox from '@material-ui/core/Checkbox'
import { WindowScroller, Column, Table } from 'react-virtualized'
import { matchPattern } from '../../lib/filter-ast'

import 'react-virtualized/styles.css'

import { Model, Filterable, Selectable, withModelData } from '../../store'

const People = new Model('people')
const PeopleSelector = new Selectable('people')
const PeopleFilter = new Filterable('people', matchPattern)

const TagList = props => (
    _.map(props.tags, tag => <Chip key={tag} className="tag" label={tag} />)
)

const renderCheckboxCell = props => (
    <Checkbox checked={props.rowData.selected} onChange={() => props.selector.toggle(props.rowData.email)}/>
)

const renderCheckboxHeader = props => (
    <Checkbox checked={props.people.reduce((prev, person) => prev && person.selected, true)} onChange={(_e, newValue) => props.people.map(_.property('email')).forEach(newValue ? props.selector.add : props.selector.remove)} />
)

const renderNameCell = props => (
    <React.Fragment>
        {props.rowData.name} <TagList tags={props.rowData.tags} />
        <Typography variant="caption">{props.rowData.email} - {_.get(props.rowData, 'current_turf.name')}, {_.get(props.rowData, 'current_turf.locality.name')} {_.get(props.rowData, 'current_turf.locality.postal_code')}</Typography>
    </React.Fragment>
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
                <Column cellRenderer={p => renderNameCell(p)} className={props.classes.cell} width={width-32-10} label='Name' dataKey='name' />
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
