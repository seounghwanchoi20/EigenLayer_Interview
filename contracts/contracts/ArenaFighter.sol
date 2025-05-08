// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

contract ArenaFighter is ERC721, ERC721URIStorage, Ownable {
    using Strings for uint256;

    uint256 private _nextTokenId;
    uint256 public constant MAX_SUPPLY = 1000;

    struct NFTTraits {
        string background;    // Background color/type
        string skin;         // Skin color/type
        string eyes;         // Eye style/color
        string mouth;        // Mouth style
        string headwear;     // Hat, crown, etc.
        string clothes;      // Clothing style
        string accessory;    // Necklace, earrings, etc.
        string special;      // Special feature
        string mood;         // Expression/mood
        string weather;      // Environmental effect
    }

    mapping(uint256 => NFTTraits) private _nftTraits;

    // Available trait options
    string[] public backgrounds = ["Red", "Blue", "Green", "Purple", "Gold", "Silver", "Rainbow", "Cosmic", "Sunset", "Dawn"];
    string[] public skins = ["Fair", "Tan", "Dark", "Pale", "Golden", "Bronze", "Olive", "Porcelain", "Rosy", "Metallic"];
    string[] public eyes = ["Round", "Almond", "Cat", "Star", "Heart", "Diamond", "Sleepy", "Angry", "Cute", "Mysterious"];
    string[] public mouths = ["Smile", "Grin", "Pout", "Open", "Smirk", "Laugh", "Serious", "Surprised", "Peaceful", "Playful"];
    string[] public headwears = ["Crown", "Beanie", "Cap", "Bow", "Halo", "Horns", "Flower", "Bandana", "None", "Helmet"];
    string[] public clothes = ["Hoodie", "Suit", "Dress", "Robe", "Armor", "Casual", "Royal", "Punk", "Cyber", "Magical"];
    string[] public accessories = ["Necklace", "Earrings", "Glasses", "Scarf", "Ring", "Watch", "Bracelet", "Pendant", "None", "Amulet"];
    string[] public specials = ["Glowing", "Sparkles", "Aura", "Wings", "Tattoo", "Scar", "Mark", "Gem", "Pattern", "Shadow"];
    string[] public moods = ["Happy", "Sad", "Excited", "Calm", "Fierce", "Shy", "Bold", "Mysterious", "Friendly", "Wild"];
    string[] public weathers = ["Sunny", "Rainy", "Stormy", "Snowy", "Windy", "Foggy", "Clear", "Starry", "Aurora", "Thunder"];

    event NFTMinted(uint256 indexed tokenId, address indexed owner, NFTTraits traits);

    constructor() ERC721("ArenaFighter", "ARENA") Ownable(msg.sender) {}

    function mintNFT() public {
        require(_nextTokenId < MAX_SUPPLY, "Max supply reached");
        
        uint256 tokenId = _nextTokenId++;
        
        // Generate random traits
        NFTTraits memory traits = _generateRandomTraits(tokenId);
        _nftTraits[tokenId] = traits;
        
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, _generateTokenURI(tokenId));
        
        emit NFTMinted(tokenId, msg.sender, traits);
    }

    function _generateRandomTraits(uint256 tokenId) private view returns (NFTTraits memory) {
        uint256 randomSeed = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            msg.sender,
            tokenId
        )));
        
        return NFTTraits({
            background: backgrounds[randomSeed % 10],
            skin: skins[(randomSeed >> 20) % 10],
            eyes: eyes[(randomSeed >> 40) % 10],
            mouth: mouths[(randomSeed >> 60) % 10],
            headwear: headwears[(randomSeed >> 80) % 10],
            clothes: clothes[(randomSeed >> 100) % 10],
            accessory: accessories[(randomSeed >> 120) % 10],
            special: specials[(randomSeed >> 140) % 10],
            mood: moods[(randomSeed >> 160) % 10],
            weather: weathers[(randomSeed >> 180) % 10]
        });
    }

    function _generateTokenURI(uint256 tokenId) private view returns (string memory) {
        NFTTraits memory traits = _nftTraits[tokenId];
        
        string memory json = Base64.encode(bytes(string(abi.encodePacked(
            '{"name": "Arena NFT #', tokenId.toString(),
            '", "description": "A unique character for the AI Arena", ',
            '"attributes": [',
            '{"trait_type": "Background", "value": "', traits.background, '"}, ',
            '{"trait_type": "Skin", "value": "', traits.skin, '"}, ',
            '{"trait_type": "Eyes", "value": "', traits.eyes, '"}, ',
            '{"trait_type": "Mouth", "value": "', traits.mouth, '"}, ',
            '{"trait_type": "Headwear", "value": "', traits.headwear, '"}, ',
            '{"trait_type": "Clothes", "value": "', traits.clothes, '"}, ',
            '{"trait_type": "Accessory", "value": "', traits.accessory, '"}, ',
            '{"trait_type": "Special", "value": "', traits.special, '"}, ',
            '{"trait_type": "Mood", "value": "', traits.mood, '"}, ',
            '{"trait_type": "Weather", "value": "', traits.weather, '"}',
            ']}'
        ))));
        
        return string(abi.encodePacked("data:application/json;base64,", json));
    }

    function getNFTTraits(uint256 tokenId) public view returns (NFTTraits memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return _nftTraits[tokenId];
    }

    // Required overrides
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage)
        returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage)
        returns (bool) {
        return super.supportsInterface(interfaceId);
    }
} 