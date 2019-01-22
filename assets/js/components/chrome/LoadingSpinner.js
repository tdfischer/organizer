import React from 'react'
import CircularProgress from '@material-ui/core/CircularProgress'
import Grid from '@material-ui/core/Grid'

export const LoadingSpinner = _props => (
    <Grid style={{height: '100%'}} container direction="column" justify="center" alignItems="center">
        <CircularProgress style={{width: '25%', height: '25%'}} />
    </Grid>
)

export default LoadingSpinner
