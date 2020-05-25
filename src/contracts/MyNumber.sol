// SPDX-License-Identifier: MIT
pragma solidity >=0.5.0;


contract MyNumber {
    string fileHash;

    // Write Function
    function set(string memory _fileHash) public {
        fileHash = _fileHash;
    }

    // Read Function
    function get() public view returns (string memory) {
        return fileHash;
    }
}
