import React from 'react'
import Button from '@material-ui/core/Button'
import Grid from '@material-ui/core/Grid'
import MobileStepper from '@material-ui/core/MobileStepper'
import SwipeableViews from 'react-swipeable-views'

const Carousel = props => (
    <React.Fragment>
        <Grid item><SwipeableViews className={props.className} index={props.index} onChangeIndex={idx => props.onIndexChanged(idx)} enableMouseEvents>{props.children}</SwipeableViews></Grid>
        <Grid item><MobileStepper
            steps={props.children.length || (props.children.size || 0)} 
            position="static"
            activeStep={props.index}
            nextButton={<Button size="small" disabled={props.index >= (props.children.length || props.children.size) - 1} onClick={() => props.onIndexChanged(props.index+1)} >Next</Button>}
            backButton={<Button size="small" disabled={props.index <= 0} onClick={() => props.onIndexChanged(props.index-1)} >Back</Button>} /></Grid>
    </React.Fragment>
)

Carousel.defaultProps = {
    children: []
}

export default Carousel
