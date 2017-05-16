import React from 'react'
import { RaisedButton, Divider, Paper } from 'material-ui'
import EBFESymbol from 'svg-react-loader!../../img/symbol.svg'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

const LoginSplash = (_props) => (
    <Paper zDepth={1} className="app-splash">
        <h1>East Bay for Everyone <div className="pop">Organizer</div></h1>
        <p>The housing shortage is not an unintended policy failure. The Bay Area
      has a housing shortage because of decades of voting and organizing against
      housing. The solution is to organize for housing.</p>
        <p>East Bay for Everyone Organizer helps people organize for housing.</p>
        <Divider />
        <p />
        <RaisedButton
            href={window.SLACK_LOGIN_URL}
            label="Sign in with EBFE Discuss"
            icon={<EBFESymbol style={{width: 'auto', 'height': '80%'}}/>}
        />
        <p>Please sign in with East Bay for Everyone Discuss to continue.</p>
        <p className="github-link"><a href="https://github.com/tdfischer/organizer/"><FontAwesomeIcon icon={['fab', 'github']} /></a></p>
    </Paper>
)

export default LoginSplash
