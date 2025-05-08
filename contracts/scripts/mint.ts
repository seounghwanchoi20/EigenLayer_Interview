import { ethers } from "hardhat";

async function main() {
  // Get the contract instance
  const contractAddress = "0xE835d7E3674fF39699C0843cc0A68cdB873D8529";
  const ArenaFighter = await ethers.getContractFactory("ArenaFighter");
  const contract = ArenaFighter.attach(contractAddress);

  console.log("Minting NFTs...");

  // Mint 3 NFTs
  for (let i = 0; i < 3; i++) {
    const tx = await contract.mintNFT();
    const receipt = await tx.wait();

    // Find the NFTMinted event
    const event = receipt?.logs.find(
      (log: any) => log.fragment?.name === "NFTMinted"
    );

    if (event) {
      const tokenId = event.args[0];
      console.log(`\nMinted NFT #${tokenId}`);

      // Get the traits
      const traits = await contract.getNFTTraits(tokenId);
      console.log("Traits:");
      console.log("- Background:", traits.background);
      console.log("- Skin:", traits.skin);
      console.log("- Eyes:", traits.eyes);
      console.log("- Mouth:", traits.mouth);
      console.log("- Headwear:", traits.headwear);
      console.log("- Clothes:", traits.clothes);
      console.log("- Accessory:", traits.accessory);
      console.log("- Special:", traits.special);
      console.log("- Mood:", traits.mood);
      console.log("- Weather:", traits.weather);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
