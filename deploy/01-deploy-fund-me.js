// This is where we define how to deploy the fund-me contract
// import
// main function -> not needed for hardhat deploy
// calling of main function -> not needed for hardhat deploy

// // hardhat-deploy is going to call a function we define in this script
// // here
// function deployFunc(hre) {
//     console.log("Hi!")
// }

// // export deployFunc as the default function hardhat-deploy looks for
// module.exports.default = deployFunc
const { network } = require("hardhat")
const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

module.exports = async ({ getNamedAccounts, deployments }) => {
    //const { getNamedAccounts, deployments } = hre
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    // get the deployer account from our namedAccounts
    const chainId = network.config.chainId

    // const ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    let ethUsdPriceFeedAddress
    if (developmentChains.includes(network.name)) {
        // In Hardhat deploy, we can just get the most recent deployment
        // give it the name of the contract you deployed
        const ethUsdAggregator = await deployments.get("MockV3Aggregator")
        ethUsdPriceFeedAddress = ethUsdAggregator.address
    } else {
        networkConfig[chainId]["ethUsdPriceFeed"]
    }

    // well what happens when we want to change chains
    // when going for localhost or hardhat network, we want to use a mock
    const args = [ethUsdPriceFeedAddress /* add address? */]
    const fundMe = await deploy("FundMe", {
        // "FundMe" is name of contract
        // a list of overrides we want to add in
        from: deployer,
        args: args,

        // put price feed address
        log: true, // do custom logging so don't have to do console.log here
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(fundMe.address, args)
    }
    log("------------------------------------------")
}

module.exports.tags = ["all", "fundme"]
