module.exports =  jest.genMockFromModule('raven-js')
module.exports.config = jest.fn(() => ({install:jest.fn()}))
