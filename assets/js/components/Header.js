import React from 'react'
import { Link } from 'react-router-dom'

const Header = (_props) => (
    <header className="row expanded">
        <div className="small-12 columns logo logo-full">
            <Link to="/">East Bay Forward</Link>
        </div>
    </header>
)

export default Header
