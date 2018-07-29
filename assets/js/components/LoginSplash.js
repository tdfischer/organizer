import React from 'react'
import Button from '@material-ui/core/Button'
import Divider from '@material-ui/core/Divider'
import Paper from '@material-ui/core/Paper'
import _ from 'lodash'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import EBFESymbol from 'svg-react-loader!../../img/symbol.svg'

const LoginSplash = (_props) => (
    <Paper zDepth={1} className="app-splash">
        <h1>East Bay for Everyone <div className="pop">Organizer</div></h1>
        <p>The housing shortage is not an unintended policy failure. The Bay Area
      has a housing shortage because of decades of voting and organizing against
      housing. The solution is to organize for housing.</p>
        <p>East Bay for Everyone Organizer helps people organize for housing.</p>
        <Divider />
        <p><EBFESymbol style={{width: 'auto', 'height': '4rem'}}/></p>
        <p>Please sign in to continue.</p>
        <p />
        {_.map(_.toPairs(window.LOGIN_URLS), ([name, url]) => (
            <p><Button
                variant="contained"
                href={url}>
                Sign in with {name} &nbsp;
                <FontAwesomeIcon icon={['fab', name]} style={{height: '2rem', width: 'auto'}}/>
            </Button></p>
        ))}
        <p className="github-link"><a href="https://github.com/tdfischer/organizer/"><FontAwesomeIcon icon={['fab', 'github']} /></a></p>
    </Paper>
)

export default LoginSplash
