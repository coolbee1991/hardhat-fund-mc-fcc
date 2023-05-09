const networkConfig = {
    4: {
        name: "rinkeby",
        ethUsdPriceFeed: "0x8A",
    },
    137: {
        name: "polygon",
        ethUsdPriceFeed: "0x8A",
    },
    // 31337
}

const developmentChains = ["hardhat", "localhost"]
const DECIMALS = 8 // 8 decimal numbers
const INITIAL_ANSWER = 200000000000 // with 8 decimals, this is 2000

module.exports = {
    // Going to export a couple things from this file, so this is why it is done this way
    networkConfig,
    developmentChains,
    DECIMALS,
    INITIAL_ANSWER,
}
