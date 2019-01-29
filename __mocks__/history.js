module.exports = {
  createBrowserHistory: () =>  {
    return {
      location: {},
      listen: jest.fn(),
      action: "",
      push: jest.fn()
    }
  }
}
