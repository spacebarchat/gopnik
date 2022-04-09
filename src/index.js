//Hack to export everything rather than exporting default object with everything
module.exports = require("./lib").default;

module.exports.Instance = require("./Instances/Instance").default;
module.exports.InstanceManager = require("./Instances/InstanceManager").default;
module.exports.InstanceClientUtil = require("./Instances/InstanceClientUtil").default;