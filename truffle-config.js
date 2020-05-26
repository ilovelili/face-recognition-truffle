require("babel-register");
require("babel-polyfill");
const HDWalletProvider = require("@truffle/hdwallet-provider");
// https://iancoleman.io/bip39/#english
const mnemonic = "acquire common quality cannon people strategy industry machine major swear once erupt";

module.exports = {
	networks: {
		development: {
			host: "127.0.0.1",
			port: 8545,
			network_id: "*", // Match any network id
		},
		ropsten: {
			provider: function() {
				return new HDWalletProvider(mnemonic, "https://ropsten.infura.io/v3/18c0c6beb5764a6fbd1e8a71ec841e8a");
			},
			network_id: 3,
		},
	},
	contracts_directory: "./src/contracts/",
	contracts_build_directory: "./src/abis/",
	compilers: {
		solc: {
			optimizer: {
				enabled: true,
				runs: 200,
			},
		},
	},
};
