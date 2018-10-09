import React from 'react'
import { connect } from 'react-redux'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogContentText from '@material-ui/core/DialogContentText'
import DialogTitle from '@material-ui/core/DialogTitle'
import InputLabel from '@material-ui/core/InputLabel'
import FormControl from '@material-ui/core/FormControl'
import { Form } from 'informed'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { library as faLibrary } from '@fortawesome/fontawesome'
import faMap from '@fortawesome/fontawesome-free-solid/faMap'
import faMapSigns from '@fortawesome/fontawesome-free-solid/faMapSigns'
import faCalendar from '@fortawesome/fontawesome-free-solid/faCalendar'
import faCalendarPlus from '@fortawesome/fontawesome-free-solid/faCalendarPlus'
import Button from '@material-ui/core/Button'
import Grid from '@material-ui/core/Grid'

import { Model, withModelData } from '../../store'

import MaterialFormText from '../MaterialFormText'

faLibrary.add(faMap, faMapSigns, faCalendar, faCalendarPlus)

import MaterialFormModelSelect from '../MaterialFormModelSelect'

const StateField = _props => (
    <FormControl fullWidth>
        <InputLabel>State</InputLabel>
        <MaterialFormModelSelect model="states" field="state" />
    </FormControl>
)

const Editor = props => (
    <Dialog {...props}>
        <DialogTitle>Editing {props.person.email}</DialogTitle>
        <Form initialValues={props.person} >
            {({formApi}) => (
                <React.Fragment>
                    <DialogContent>
                        <DialogContentText>
                            <Grid direction="column" spacing={8} container>
                                <Grid item><FontAwesomeIcon icon={['fa', 'map']} /> {props.person.geo.lat}, {props.person.geo.lng}</Grid>
                                <Grid item><FontAwesomeIcon icon={['fa', 'map-signs']} /> {props.person.current_turf.name}, {props.person.current_turf.locality.name}</Grid>
                                <Grid item><FontAwesomeIcon icon={['fa', 'calendar']} /> {props.person.twelve_month_event_count} in last 12 months.</Grid>
                                <Grid item><FontAwesomeIcon icon={['fa', 'calendar-plus']} /> {props.person.created}</Grid>
                                <Grid item><StateField /></Grid>
                                <Grid direction="row" spacing={8} item container>
                                    <Grid item><MaterialFormText label="Name" field="name" /></Grid>
                                    <Grid item><MaterialFormText label="E-mail" field="email" /></Grid>
                                </Grid>
                                <Grid item><MaterialFormText fullwidth label="Address" field="address" /></Grid>
                            </Grid>
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={props.onClose} color="secondary">Cancel</Button>
                        <Button variant="contained" onClick={() => props.onSave(formApi.values)} color="primary">Save</Button>
                    </DialogActions>
                </React.Fragment>
            )}
        </Form>
    </Dialog>
)

Editor.defaultProps = {
    person: {
        current_turf: {
            locality: {}
        },
        geo: {}
    }
}

const People = new Model('people')

const mapStateToProps = (state, props) => {
    return {
        person: People.immutableSelect(state).get(props.personID)
    }
}

const propsToModel = props => {
    return {
        people: props.personID
    }
}

export default connect(mapStateToProps)(withModelData(propsToModel)(Editor))
