import React from 'react'
import { withState } from 'recompose'
import { Form } from 'informed'
import DialogContent from '@material-ui/core/DialogContent'
import DialogTitle from '@material-ui/core/DialogTitle'
import Grid from '@material-ui/core/Grid'
import Button from '@material-ui/core/Button'
import MaterialFormText from '../../MaterialFormText'

export const SignupForm = props => {
    const orgName = (window.ORG_METADATA || {}).name
    return (
        <Form onSubmit={values => props.onSubmit(values).then(() => props.setHasSaved(true))}>
            {props.hasSaved ? (
                <React.Fragment>
                    <DialogTitle>Thanks!</DialogTitle>
                    <DialogContent>
                        An organizer will get in touch.
                    </DialogContent>
                </React.Fragment>
            ) : (
                <React.Fragment>
                    <DialogTitle>Join {orgName}!</DialogTitle>
                    <DialogContent>
                        <Grid container direction="column" justify="center" alignItems="stretch" spacing={8}>
                            <Grid item>You&apos;re not logged in as a member, but that&apos;s okay! Enter your e-mail address to RSVP or sign in.</Grid>
                            <Grid item><MaterialFormText fullWidth label="E-Mail" field="email" validate={v => (v && v.indexOf('@') != -1) ? null : 'Please enter your e-mail address.'}/></Grid>
                            <Grid item><Button fullWidth variant="contained" color="primary" type="submit">Sign up</Button></Grid>
                        </Grid>
                    </DialogContent>
                </React.Fragment>
            )}
        </Form>
    )
}


export default withState('hasSaved', 'setHasSaved', false)(SignupForm)
