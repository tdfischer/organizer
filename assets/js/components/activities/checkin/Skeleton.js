import React from 'react'
import { withStyles } from '@material-ui/styles'

import Grid from '@material-ui/core/Grid'

const carouselStyles = {
    card: {
        backgroundColor: '#eee',
        animationName: '$fade',
        animationDuration: '1s',
        animationIterationCount: 'infinite',
        animationDirection: 'alternate',
        animationTimingFunction: 'ease-out',
        height: '14rem',
        margin: '1rem'
    },
    '@keyframes fade': {
        from: {
            backgroundColor: '#fafafa'
        },
        to: {
            backgroundColor: '#ddd'
        }
    }
}

export const Skeleton = props => (
    <Grid item container spacing={8} centerItems="stretch" direction="column">
        <Grid item className={props.classes.card} />
        <Grid item className={props.classes.card} />
    </Grid>
)

export default withStyles(carouselStyles)(Skeleton)
