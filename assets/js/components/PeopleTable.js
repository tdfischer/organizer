import React from 'react'
import PropTypes from 'prop-types'
import ImmutablePropTypes from 'react-immutable-proptypes'
import _ from 'lodash'
import { connect } from 'react-redux'
import Chip from '@material-ui/core/Chip'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableRow from '@material-ui/core/TableRow'
import TableHead from '@material-ui/core/TableHead'
import Checkbox from '@material-ui/core/Checkbox'
import ColorHash from 'color-hash'

import { Model, Filterable, Selectable } from '../store'

const matchAny = (obj, pattern) => {
    try {
        const regex = new RegExp(pattern)
        return !!_.find(_.values(obj), (value) => {
            if (_.isString(value)) {
                return value.match(regex)
            }
            return matchAny(value, pattern)
        })
    } catch (SyntaxError) {
        // nothing 
    }
}

const hasher = new ColorHash()
const personHasher = new ColorHash({lightness: 0.8})

const People = new Model('people')
const PeopleSelector = new Selectable('people')
const PeopleFilter = new Filterable('people', matchAny)

const TagList = props => (
    _.map(props.tags, tag => <Chip key={tag} className="tag" label={tag} />)
)

const PersonRow = props => (
    <TableRow style={{backgroundColor: personHasher.hex(props.turf)}} key={props.person.id}>
        <TableCell padding="checkbox">
            <Checkbox checked={props.person.selected} onChange={() => props.selector.toggle(props.person.email)}/>
        </TableCell>
        <TableCell>{props.person.name}<TagList tags={props.person.tags} /></TableCell>
        <TableCell>{props.person.email}</TableCell>
    </TableRow>
)

PersonRow.propTypes = {
    person: PropTypes.object.isRequired,
    selector: PropTypes.object.isRequired,
    turf: PropTypes.string.isRequired
}

const TurfSection = props => (
    <React.Fragment key={props.turf}>
        <TableRow style={{backgroundColor: hasher.hex(props.turf)}}>
            <TableCell padding="none">
                <Checkbox checked={props.people.reduce((prev, person) => prev && person.selected, true)} onChange={(_e, newValue) => props.people.map(_.property('email')).forEach(newValue ? props.selector.add : props.selector.remove)}/>
            </TableCell>
            <TableCell colSpan={2}>{props.turf}</TableCell>
        </TableRow>
        {props.people.map(person => (
            <PersonRow key={person.id} person={person} turf={props.turf} selector={props.selector} />
        ))}
    </React.Fragment>
)

TurfSection.propTypes = {
    people: ImmutablePropTypes.iterableOf(PropTypes.object).isRequired,
    selector: PropTypes.object.isRequired,
    turf: PropTypes.string.isRequired
}

export const PeopleTable = props => (
    <Table>
        <TableHead>
            <TableRow>
                <TableCell padding="checkbox">
                    <Checkbox checked={props.filteredPeople.reduce((prev, person) => prev && person.selected, true)} onChange={(_e, newValue) => props.filteredPeople.map(_.property('email')).forEach(newValue ? props.selector.add : props.selector.remove)} />
                </TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
            </TableRow>
        </TableHead>
        <TableBody>
            {props.filteredPeople.groupBy(p => _.get(p, 'current_turf.name', '(No Turf)')).map((people, turf) => (
                <TurfSection key={turf} turf={turf} people={people.toIndexedSeq()} selector={props.selector} />
            )).toIndexedSeq().toArray()}
        </TableBody>
    </Table>
)

const mapStateToProps = (state, props) => {
    // Select all people with this state
    const allPeople = People.immutableSelect(state)
    const myPeople = allPeople.filter(_.matchesProperty('state', props.state))

    // Grab list of selected IDs
    const selection = PeopleSelector.immutableSelected(state).filter(myPeople.has).toList()

    // Apply filters
    const filteredPeople = PeopleFilter.filtered(state, myPeople)
        .map(person => ({...person, selected: selection.contains(person.email)}))
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
    state: PropTypes.string.isRequired
}

export default connect(mapStateToProps, mapDispatchToProps)(PeopleTable)
