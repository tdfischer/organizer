import Gravatar from './Gravatar'
import { connect } from 'react-redux'

import { getCurrentUser } from '../selectors/auth'

const mapStateToProps = state => {
    return {
        email: getCurrentUser(state).email
    }
}

export const UserAvatar = connect(mapStateToProps)(Gravatar)

export default UserAvatar
