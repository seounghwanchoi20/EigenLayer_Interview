import { ethers } from "hardhat";

async function main() {
  const ArenaFighter = await ethers.getContractFactory("ArenaFighter");
  const arenaFighter = await ArenaFighter.deploy();
  await arenaFighter.waitForDeployment();

  const address = await arenaFighter.getAddress();
  console.log("ArenaFighter deployed to:", address);

  // Verify the contract on BaseScan
  console.log("Waiting for 5 block confirmations before verification...");
  await arenaFighter.deploymentTransaction()?.wait(5);

  console.log("Verifying contract on BaseScan...");
  try {
    await run("verify:verify", {
      address: address,
      constructorArguments: [],
    });
    console.log("Contract verified successfully");
  } catch (error) {
    console.log("Verification failed:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
