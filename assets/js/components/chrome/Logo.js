import React from 'react'
import EBFESymbol from 'svg-react-loader!../../../img/symbol.svg'

const Logo = props => (
    (window.ORG_METADATA || {}).logo_url ? <img {...props} src={window.ORG_METADATA.logo_url} /> : <EBFESymbol {...props} />
)

export default Logo
