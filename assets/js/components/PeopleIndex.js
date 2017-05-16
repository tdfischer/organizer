import React from 'react'
import { connect } from 'react-redux'
import Model from '../store/model'
import Selectable from '../store/select'
import Filterable from '../store/filter'
import _ from 'lodash'
import { Form } from 'informed'
import TextField from '@material-ui/core/TextField'
import Button from '@material-ui/core/Button'
import Grid from '@material-ui/core/Grid'
import Chip from '@material-ui/core/Chip'

import MaterialFormText from './MaterialFormText'

const People = new Model('people')

const PeopleSelector = new Selectable('people')

const PeopleFilter = new Filterable('people', p => _.get(p.address, 'raw', 'California') + ' ' + p.name + ' ' + p.tags.join(',') + ' ' + p.email)

const mapStateToProps = state => {
    return {
        allPeople: People.select(state).all(),
        selection: PeopleSelector.selected(state),
        filtered: PeopleFilter.filtered(state, People.select(state).all().slice),
    }
}

const mapDispatchToProps = dispatch => {
    return {
        people: People.bindActionCreators(dispatch),
        selector: PeopleSelector.bindActionCreators(dispatch),
        filter: PeopleFilter.bindActionCreators(dispatch),
    }
}

const mapTaggerDispatchToProps = dispatch => {
    return {
        removeTag: (formApi) => {
            dispatch((dispatch, getState) => {
                const selectedPeople = PeopleSelector.selected(getState())
                _.each(selectedPeople, id => {
                    dispatch(People.updateAndSave(id, person => ({
                        ...person,
                        tags: _.without(person.tags, formApi.getValue('tag'))
                    })))
                })
            })
        },
        addTag: (formApi) => {
            dispatch((dispatch, getState) => {
                const selectedPeople = PeopleSelector.selected(getState())
                _.each(selectedPeople, id => {
                    dispatch(People.updateAndSave(id, person => ({
                        ...person,
                        tags: [...person.tags, formApi.getValue('tag')]
                    })))
                })
            })
        }
    }
}

const Tagger = connect(() => ({}), mapTaggerDispatchToProps)(props => (
    <Form>
        {({formApi}) => (
            <Grid container>
                <Grid item xs={6}><MaterialFormText label="Tag" field="tag" /></Grid>
                <Grid item xs={3}><Button color="secondary" variant="contained" onClick={() => props.removeTag(formApi)} type="submit">Remove tag</Button></Grid>
                <Grid item xs={3}><Button color="secondary" variant="contained" onClick={() => props.addTag(formApi)} value="add" type="submit">Add tag</Button></Grid>
            </Grid>
        )}
    </Form>
))

const PeopleIndex = connect(mapStateToProps, mapDispatchToProps)(props => {
    const people = _.map(props.filtered, (person, idx) => {
        const tags = _.map(person.tags, tag => (
            <Chip key={tag} className="tag" label={tag} />
        ))
        return (
            <tr key={person.id} className={idx % 2 == 0 ? 'even' : 'odd'}>
                <td><input type="checkbox" checked={props.selection.indexOf(person.id) != -1} onChange={() => props.selector.toggle(person.id)}/></td>
                <td>{person.name}{tags}</td>
                <td>{person.email}</td>
                <td>{_.get(person.address, 'locality', '')}</td>
            </tr>
        )
    })
    return (
        <div>
            <h1>People</h1>
            <Grid container>
                <Grid item xs={3}>
                    <Button color="primary" variant="contained" onClick={() => props.people.refresh()}>Load</Button>
                </Grid>
                <Grid item xs={6}>
                    <Tagger />
                </Grid>
                <Grid item xs={3}>
                    <TextField label="Search" onChange={e => props.filter.set(e.target.value)} />
                </Grid>
            </Grid>
            <table>
                <thead>
                    <tr>
                        <th colSpan="2">Name</th>
                        <th>Email</th>
                        <th>City</th>
                    </tr>
                </thead>
                <tbody>
                    {people}
                </tbody>
            </table>
        </div>
    )
})

export default PeopleIndex
