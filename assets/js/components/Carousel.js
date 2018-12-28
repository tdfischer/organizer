import React from 'react'
import Button from '@material-ui/core/Button'
import MobileStepper from '@material-ui/core/MobileStepper'
import SwipeableViews from 'react-swipeable-views'

const Carousel = props => (
    <React.Fragment>
        <SwipeableViews style={{paddingLeft: '1rem', paddingRight: '1rem'}} index={props.index} onChangeIndex={idx => props.setIndex(idx)} enableMouseEvents>{props.children}</SwipeableViews>
        <MobileStepper
            steps={props.children.length || 0} 
            position="static"
            activeStep={props.index}
            nextButton={<Button size="small" disabled={props.index >= props.children.length-1} onClick={() => props.setIndex(props.index+1)} >Next</Button>}
            backButton={<Button size="small" disabled={props.index <= 0} onClick={() => props.setIndex(props.index-1)} >Back</Button>} />
    </React.Fragment>
)

export default Carousel
