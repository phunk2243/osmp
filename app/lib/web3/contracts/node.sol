// src/contracts/NodeNFT.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NodeNFT
 * @dev ERC-721 token representing Manufacturing Nodes in OSMP network.
 * Only the contract owner (deployer) can mint new Node NFTs.
 */
contract NodeNFT is ERC721URIStorage, Ownable {
    /// @notice Next token ID to be minted
    uint256 public nextTokenId;

    /**
     * @dev Initializes the ERC721 contract with name and symbol, and sets the owner.
     */
    constructor() ERC721("OSMP Node", "NODE") Ownable(msg.sender) {}

    /**
     * @notice Mints a new Node NFT to the specified address with metadata URI.
     * @param to The recipient address
     * @param metadataURI The tokenURI (base64 JSON or IPFS URI)
     */
    function mintNode(address to, string memory metadataURI) external onlyOwner {
        uint256 tokenId = nextTokenId;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, metadataURI);
        nextTokenId = tokenId + 1;
    }

    /**
     * @notice Burns a Node NFT
     * @param tokenId The token ID to burn
     */
    function burnNode(uint256 tokenId) external onlyOwner {
        _burn(tokenId);
    }
}
