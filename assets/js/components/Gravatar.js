import React from 'react'
import gravatar from 'gravatar'
import Avatar from '@material-ui/core/Avatar'

export const Gravatar = props => (
    <Avatar
        src={gravatar.url(props.email, {s:32, d: 'retro'})}
        {...props} />
)

export default Gravatar
