import React from 'react'
import { shallow } from 'enzyme'
import DialogOpener from './DialogOpener'

it('should safely render defaults', () => {
    const dialogFn = jest.fn()
    shallow(
        <DialogOpener>
            {dialogFn}
        </DialogOpener>
    )
    expect(dialogFn).toHaveBeenCalledTimes(1)
})
