import React from 'react'
import Button from '@material-ui/core/Button'
import Divider from '@material-ui/core/Divider'
import Paper from '@material-ui/core/Paper'
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
        <Button
            variant="contained"
            href={window.LOGIN_URL}>
            Sign in with EBFE Discuss
            <EBFESymbol style={{width: 'auto', 'height': '80%'}}/>
        </Button>
        <p>Please sign in with East Bay for Everyone Discuss to continue.</p>
        <p className="github-link"><a href="https://github.com/tdfischer/organizer/"><FontAwesomeIcon icon={['fab', 'github']} /></a></p>
    </Paper>
)

export default LoginSplash
