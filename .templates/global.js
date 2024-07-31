const packageJson = require('../package.json')

module.exports = () => {
  return {
    prefix: "sl",
    projectName: packageJson.name
  }
}
