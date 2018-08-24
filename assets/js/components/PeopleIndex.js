import React, { Component } from 'react'
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
import Tabs from '@material-ui/core/Tabs'
import Tab from '@material-ui/core/Tab'
import Snackbar from '@material-ui/core/Snackbar'
import Badge from '@material-ui/core/Badge'
import importedComponent from 'react-imported-component'
import copy from 'copy-to-clipboard'
import ColorHash from 'color-hash'

import MaterialFormText from './MaterialFormText'
import DialogOpener from './DialogOpener'

const ImportDialog = importedComponent(() => import('./ImportDialog'))

const hasher = new ColorHash()
const personHasher = new ColorHash({lightness: 0.8})

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

const States = new Model('states')
const People = new Model('people')
const PeopleSelector = new Selectable('people')
const PeopleFilter = new Filterable('people', matchAny)

const mapStateToProps = state => {
    const selection = PeopleSelector.selected(state)
    const stateCounts = _.countBy(selection.slice, 'state')
    return {
        allStates: States.select(state).all().slice,
        allPeople: People.select(state).all().slice,
        stateCounts,
        selection,
        filtered: PeopleFilter.filtered(state, People.select(state).all().slice),
    }
}

const mapDispatchToProps = dispatch => {
    return {
        people: People.bindActionCreators(dispatch),
        states: States.bindActionCreators(dispatch),
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
                const selectedPeople = PeopleSelector.selected(getState()).slice
                return Promise.all(_.map(selectedPeople, person=> {
                    dispatch(People.updateAndSave(person.id, person => ({
                        ...person,
                        tags: _.without(person.tags, formApi.getValue('tag'))
                    })))
                }))
            })
        },
        addTag: (formApi) => {
            dispatch((dispatch, getState) => {
                const selectedPeople = PeopleSelector.selected(getState()).slice
                return Promise.all(_.map(selectedPeople, person => (
                    dispatch(People.updateAndSave(person.id, person => ({
                        ...person,
                        tags: [...person.tags, formApi.getValue('tag')]
                    })))
                )))
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

const mapPeopleStateToProps = (state, props) => {
    const selection = PeopleSelector.selected(state)
    const selectedPeople = _.filter(selection.slice, {state: props.state})
    const allPeople = People.select(state).filterBy('state', props.state).slice
    const filteredPeople = PeopleFilter.filtered(state, allPeople)
    return {
        selection,
        selectedPeople,
        filteredPeople
    }
}

const mapPeopleDispatchToProps = dispatch => {
    return {
        selector: PeopleSelector.bindActionCreators(dispatch),
    }
}

const PeopleTable = connect(mapPeopleStateToProps, mapPeopleDispatchToProps)(props => (
    <Table>
        <TableHead>
            <TableRow>
                <TableCell padding="checkbox">
                    <Checkbox checked={props.selectedPeople.length >= props.filteredPeople.length} onChange={(_e, newValue) => _.each(props.filteredPeople, newValue ? props.selector.add : props.selector.remove)} />
                </TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
            </TableRow>
        </TableHead>
        <TableBody>
            {_.map(_.groupBy(props.filteredPeople, p => _.get(p, 'current_turf.name', '(No Turf)')), (people, turf) => (
                <React.Fragment key={turf}>
                    <TableRow style={{backgroundColor: hasher.hex(turf)}}>
                        <TableCell padding="none">
                            <Checkbox checked={_.reduce(people, (prev, person) => prev && props.selection.contains(person), true)} onChange={(_e, newValue) => _.each(people, newValue ? props.selector.add : props.selector.remove)}/>
                        </TableCell>
                        <TableCell colSpan={2}>{turf}</TableCell>
                    </TableRow>
                    {_.map(people, person => {
                        console.log(person)
                        const tags = _.map(person.tags, tag => (
                            <Chip key={tag} className="tag" label={tag} />
                        ))
                        return (
                            <TableRow style={{backgroundColor: personHasher.hex(turf)}} key={person.id}>
                                <TableCell padding="checkbox">
                                    <Checkbox checked={props.selection.contains(person)} onChange={() => props.selector.toggle(person)}/>
                                </TableCell>
                                <TableCell>{person.name}{tags}</TableCell>
                                <TableCell>{person.email}</TableCell>
                            </TableRow>
                        )
                    })}
                </React.Fragment>
            ))}
        </TableBody>
    </Table>
))

export class PeopleIndex extends Component {
    constructor(props) {
        super(props)
        this.state = {
            currentState: 0,
            copied: false
        }
        this.onCopy = this.onCopy.bind(this)
    }

    onCopy() {
        this.setState({copied: true})
        copy(_.map(this.props.selection.slice, 'email').join(', '))
    }

    componentDidMount() {
        this.props.people.fetchAll()
        this.props.states.fetchAll()
    }

    render() {
        const props = this.props
        return (
            <React.Fragment>
                <Snackbar open={this.state.copied} onClose={() => this.setState({copied: false})} message={'Copied '+this.props.selection.slice.length+' e-mails'}/>
                <Grid container spacing={24}>
                    <Grid item xs={3}>
                        <DialogOpener>
                            {(open, close, isOpen) => (
                                <React.Fragment>
                                    <Button color="primary" onClick={open}>Import Spreadsheet</Button>
                                    <ImportDialog onImport={props.importPeople} open={isOpen} onClose={close} />
                                </React.Fragment>
                            )}
                        </DialogOpener>
                        <Button color="primary" onClick={this.onCopy}>Copy E-mails</Button>
                    </Grid>
                    <Grid item xs={6}>
                        <Tagger />
                    </Grid>
                    <Grid item xs={3}>
                        <TextField label="Search" onChange={e => props.filter.set(e.target.value)} />
                    </Grid>
                </Grid>
                {(props.allStates.length > 0) ? (
                    <React.Fragment>
                        <Tabs fullWidth onChange={(_e, v) => this.setState({currentState: v})} value={this.state.currentState}>
                            {_.map(props.allStates, state => (
                                <Tab key={state.id} label={
                                    _.get(props.stateCounts, state.name)
                                        ? (<Badge color="primary" badgeContent={props.stateCounts[state.name]} >{state.name}</Badge>)
                                        : state.name
                                } />
                            ))}
                        </Tabs>
                        <PeopleTable state={props.allStates[this.state.currentState].name} />
                    </React.Fragment>
                ) : null}
            </React.Fragment>
        )
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(PeopleIndex)
