const MyNumber = artifacts.require("MyNumber");

require("chai")
	.use(require("chai-as-promised"))
	.should();

contract("MyNumber", (accounts) => {
	let mynumber;

	before(async () => {
		mynumber = await MyNumber.deployed();
	});

	describe("deployment", async () => {
		it("deploys successfully", async () => {
			const address = mynumber.address;
			assert.notEqual(address, 0x0);
			assert.notEqual(address, "");
			assert.notEqual(address, null);
			assert.notEqual(address, undefined);
		});
	});

	describe("storage", async () => {
		it("updates the fileHash", async () => {
			let fileHash = "123abc";
			await mynumber.set(fileHash);
			const result = await mynumber.get();
			assert.equal(result, fileHash);
		});
	});
});
