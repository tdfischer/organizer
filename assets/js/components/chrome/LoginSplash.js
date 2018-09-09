import React from 'react'
import Button from '@material-ui/core/Button'
import Divider from '@material-ui/core/Divider'
import Paper from '@material-ui/core/Paper'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { library as faLibrary } from '@fortawesome/fontawesome'
import faDiscourse from '@fortawesome/fontawesome-free-brands/faDiscourse'
import faSlack from '@fortawesome/fontawesome-free-brands/faSlack'
import faGithub from '@fortawesome/fontawesome-free-brands/faGithub'

import './LoginSplash.scss'

import EBFESymbol from 'svg-react-loader!../../../img/symbol.svg'

faLibrary.add(faDiscourse, faSlack, faGithub)

export const LoginSplash = (_props) => (
    <Paper className="app-splash">
        <p><EBFESymbol style={{width: 'auto', 'height': '4rem'}}/></p>
        <p>Please sign in with your EBFE account to continue.</p>
        <p />
        {Object.entries(window.LOGIN_URLS || []).map(([name, url]) => (
            <p key={name}><Button
                variant="contained"
                href={url}>
                Sign in with {name} &nbsp;
                <FontAwesomeIcon icon={['fab', name]} style={{height: '2rem', width: 'auto'}}/>
            </Button></p>
        ))}
        <p><em><a href="https://eastbayforeveryone.org/join">Not a member?</a></em></p>
        <Divider />
        <h1>East Bay for Everyone <div className="pop">Organizer</div></h1>
        <p>The housing shortage is not an unintended policy failure. The Bay Area
      has a housing shortage because of decades of voting and organizing against
      housing. The solution is to organize for housing.</p>
        <p>East Bay for Everyone Organizer helps people organize for housing.</p>
        <p className="github-link"><a href="https://github.com/tdfischer/organizer/"><FontAwesomeIcon icon={['fab', 'github']} /></a></p>
    </Paper>
)

export default (LoginSplash)
