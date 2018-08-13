import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { Selectable , Filterable, Model } from '../store'
import _ from 'lodash'
import { Form } from 'informed'
import TextField from '@material-ui/core/TextField'
import Button from '@material-ui/core/Button'
import Grid from '@material-ui/core/Grid'
import Chip from '@material-ui/core/Chip'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableRow from '@material-ui/core/TableRow'
import TableHead from '@material-ui/core/TableHead'
import Checkbox from '@material-ui/core/Checkbox'
import importedComponent from 'react-imported-component'

import MaterialFormText from './MaterialFormText'
import DialogOpener from './DialogOpener'

const ImportDialog = importedComponent(() => import('./ImportDialog'))

const People = new Model('people')
const PeopleSelector = new Selectable('people')
const PeopleFilter = new Filterable('people', p => _.get(p.address, 'raw', 'California') + ' ' + p.name + ' ' + p.tags.join(',') + ' ' + p.email + ' ' + p.state, (a, b) => a.match(new RegExp(b || '')))

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
        importPeople: people => {
            return Promise.all(_.map(people, person => dispatch(People.updateAndSave(person.email, person))))
        }
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

export class PeopleIndex extends PureComponent {
    componentDidMount() {
        this.props.people.refresh()
    }

    render() {
        const props = this.props
        const people = _.flatMap(_.groupBy(props.filtered, 'state'), (people, state) => {
            var ret = []
            ret.push((<TableRow key={'state-'+state.id}><TableCell variant="head" colSpan={3}>{state}</TableCell></TableRow>))
            ret.push(_.map(people, person => {
                const tags = _.map(person.tags, tag => (
                    <Chip key={tag} className="tag" label={tag} />
                ))
                return (
                    <TableRow key={person.id}>
                        <TableCell padding="checkbox">
                            <Checkbox checked={props.selection.contains(person.id)} onChange={() => props.selector.toggle(person.id)}/>
                        </TableCell>
                        <TableCell>{person.name}{tags}</TableCell>
                        <TableCell>{person.email}</TableCell>
                    </TableRow>
                )
            }))
            return ret
        })
        return (
            <React.Fragment>
                <Grid container spacing={24}>
                    <Grid item xs={3}>
                        <DialogOpener>
                            {(open, close, isOpen) => (
                                <React.Fragment>
                                    <Button color="primary" variant="contained" onClick={open}>Import Spreadsheet</Button>
                                    <ImportDialog onImport={props.importPeople} open={isOpen} onClose={close} />
                                </React.Fragment>
                            )}
                        </DialogOpener>
                    </Grid>
                    <Grid item xs={6}>
                        <Tagger />
                    </Grid>
                    <Grid item xs={3}>
                        <TextField label="Search" onChange={e => props.filter.set(e.target.value)} />
                    </Grid>
                </Grid>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell padding="checkbox"></TableCell>
                            <TableCell>Name</TableCell>
                            <TableCell>Email</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {people}
                    </TableBody>
                </Table>
            </React.Fragment>
        )
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(PeopleIndex)
