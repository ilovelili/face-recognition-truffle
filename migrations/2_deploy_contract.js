const MyNumber = artifacts.require("MyNumber");

module.exports = function(deployer) {
	deployer.deploy(MyNumber);
};
