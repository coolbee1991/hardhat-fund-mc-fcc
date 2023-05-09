require("dotenv").config()

require("@nomiclabs/hardhat-etherscan")
require("@nomiclabs/hardhat-waffle")
require("hardhat-gas-reporter")
require("solidity-coverage")
require("hardhat-deploy")

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
    const accounts = await hre.ethers.getSigners()

    for (const account of accounts) {
        console.log(account.address)
    }
})

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const RINKEBY_RPC_URL = process.env.RINKEBY_RPC_URL
const PRIVATE_KEY = process.env.PRIVATE_KEY
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
    //solidity: "0.8.8",
    // We can actually add multiple solidity versions
    solidity: {
        compilers: [{ version: "0.8.8" }, { version: "0.6.6" }],
    },
    defaultNetwork: "hardhat",
    networks: {
        ropsten: {
            url: process.env.ROPSTEN_URL || "",
            accounts:
                process.env.PRIVATE_KEY !== undefined
                    ? [process.env.PRIVATE_KEY]
                    : [],
        },
        // rinkeby: {
        //     url: RINKEBY_RPC_URL,
        //     accounts: [PRIVATE_KEY],
        //     chainId: 4,
        //     blockConfirmations: 6, // wait 6 blocks -> to be used in 01-deploy-fund-me
        // },
    },
    // gasReporter: {
    //     enabled: process.env.REPORT_GAS !== undefined,
    //     currency: "USD",
    // },
    gasReporter: {
        enabled: true,
        outputFile: "gas-report.txt",
        noColors: true,
        currency: "USD",
        // coinmarketcap: COINMARKETCAP_API_KEY,
        token: "MATIC",
    },
    etherscan: {
        apiKey: process.env.ETHERSCAN_API_KEY,
    },
    // Intstead of accounts: [privatekey1, privatekey2, privatekey3]
    // can have namedAccounts
    namedAccounts: {
        // one of them is called deployer
        deployer: {
            // by default, the 0th account is going to be deployer
            default: 0,
            // can also specify which number the deployer account is
            // going to be at on different chains
            // e.g. 4: 1 // ringeby, 1st position
        },
        // can create multiple users
        user: {
            default: 1,
        },
    },
}
