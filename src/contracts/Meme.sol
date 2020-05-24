// SPDX-License-Identifier: MIT
pragma solidity >=0.5.0;


contract Meme {
    string memeHash;

    // Write Function
    function set(string memory _memeHash) public {
        memeHash = _memeHash;
    }

    // Read Function
    function get() public view returns (string memory) {
        return memeHash;
    }
}
