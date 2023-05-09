// 00 because this is almost pre-deploy stuff
// we don't always do this, we only do it sometime
// We'll use on networks that don't have established priceFeed
// contracts, our own contracts
const { network } = require("hardhat")
const {
    developmentChains,
    DECIMALS,
    INITIAL_ANSWER,
} = require("../helper-hardhat-config")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    // const chainId = network.config.chainId

    // includes() check if something is inside array
    if (developmentChains.includes(network.name)) {
        log("Local network detected! Deploying mocks...") // log is basically console.log
        await deploy("MockV3Aggregator", {
            contract: "MockV3Aggregator",
            from: deployer,
            log: true,
            args: [DECIMALS, INITIAL_ANSWER], // ??? constructor args
            // looking in MockV3Aggregator.sol in smartcontractkit/chainlink
            // repo, the _decimals paramter is equivalent to rinkeby.etherscan.io
            // Contract tab, 3. decimals function
            // and _initialAnswer is basically just what is the priceFeed starting at
            // so we get to pick out price for our priceFeed, which is great for testing
        })
        log("Mocks deployed!")
        // big line signaling this is end of this deploy script
        // anything after that is going to be a different deploy script
        log("---------------------------------------------")
    }
}

module.exports.tags = ["all", "mocks"]
// with this, we can run yarn hardhat deploy --tags all
// and it will only run deploy scripts with a special tag
