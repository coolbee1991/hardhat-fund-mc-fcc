// we're actually going to use Hardhat-deploy to automatically
const { deployments, ethers, getNamedAccounts } = require("hardhat")
const { assert, expect } = require("chai") // chai is overwritten by waffle
const {
    experimentalAddHardhatNetworkMessageTraceHook,
} = require("hardhat/config")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : // set up our tests as if both of the deploy functions had been run
      describe("FundMe", function () {
          // Function in describe shouldn't be async

          let fundMe
          let deployer
          let mockV3Aggregator
          // const sendValue = "1000000000000000000" // 18 zeros, 1 ETH
          const sendValue = ethers.utils.parseEther("1")
          beforeEach(async function () {
              //const { deployer } = await getNamedAccounts()
              // this is a bit finnicky -> getting deployer object and assign it like so
              deployer = (await getNamedAccounts()).deployer
              // another way to get accounts from your hardhat.config
              // const accounts = await ethers.getSigners()
              // // ethers.getSigners() will returns whatever is in the accounts[]
              // // section of your network
              // // from default network hardhat, you will get 10 fake accounts
              // // you can work with
              // const accountZero = accounts[0]

              // deploy fundMe contract using Hardhat-deploy
              // fixture basically lets us run our entire deploy folder
              // with as much tags as we want
              console.log(`Deployer is: ${deployer}`)
              await deployments.fixture(["all"])
              // Hardhat-deploy wraps ethers with a getContract
              // gets most recent deployment of whatever contract we tell it
              console.log("after deployments.fixture") //, `ethers = ${ethers}`)
              console.log(`ethers is : ${ethers}`)
              fundMe = await ethers.getContract("FundMe", deployer)
              // connect deployer account to fundMe. Whenever we call
              // fundMe, it will automatically be from deployer account

              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              )
              console.log(`FundMe: ${fundMe}`)
          })

          // we can group our tests based off of different functions
          // first set of tests based off of constructor
          describe("constructor", function () {
              it("sets the aggregator addresses correctly", async function () {
                  const response = await fundMe.s_priceFeed()
                  assert.equal(response, mockV3Aggregator.address)
              })
          })
          //it()

          describe("fund", async function () {
              // If we are going line by line, the first thing we should
              // look at is the require line. We should see if the
              // function fails if require condition is false
              it("Fails if you don't send enough ETH", async function () {
                  // await fundMe.fund()
                  // with waffle, we can expect() transactions to be reverted
                  // or fail
                  // can just use to.be.reverted or be more specific, give exact
                  // error using revertedWith("exact_error")
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "You need to spend more ETH!"
                  )
              })
              it("updated the amount funded data structure", async function () {
                  await fundMe.fund({ value: sendValue })
                  const response = await fundMe.s_addressToAmountFunded(
                      deployer
                  )
                  assert.equal(response.toString(), sendValue.toString())
              })
              it("Adds funder to array of s_funders", async function () {
                  await fundMe.fund({ value: sendValue })
                  const funder = await fundMe.s_funders(0) // s_funders array at index 0
                  assert.equal(funder, deployer)
              })
          })

          describe("withdraw", async function () {
              // before withdraw, we probably want the contract to have money
              // so we can run beforeEach to automatically fund the contract
              // before we run any tests
              beforeEach(async function () {
                  await fundMe.fund({ value: sendValue })
              })

              it("Withdraw ETH from a single founder", async function () {
                  // way to think about writing the test, you want to Arrange
                  // the test, Act, and then Assert the result
                  // Arrange
                  // we can also use ethers.provider, using fundMe.provider
                  // because we are using the provider of the fundMe contract
                  // it doesn't matter which, we are looking for the getBalance
                  // function of the provider object
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)
                  // Act
                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  // Now, we should be able to check the entire FundMeBalance
                  // has been transferred to DeployerBalance
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)
                  // gasCost
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  // Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  )
              })

              it("allows us to withdraw with multipled s_funders", async function () {
                  // Arrange
                  const accounts = await ethers.getSigners()
                  // then we can loop through these accounts, and have each
                  // account call the fund function with a for loop
                  // we'll start with first index of account because 0th index
                  // is going to be the deployer
                  for (let i = 1; i < 6; i++) {
                      // we need to call this connect function because right now
                      // our fundMe contract through ethers.getContract is connected
                      // to our deployer account and when we call a transaction
                      // with fundMe, the deployer is the account that is calling
                      // the transaction
                      // We need to create new objects to connect to all these
                      // different accounts
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      )
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  // Act
                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  // Assert
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  )

                  // Make sure that the s_funders are reset properly
                  await expect(fundMe.s_funders(0)).to.be.reverted

                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.s_addressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      )
                  }
              })

              it("Only allows the owner to withdraw", async function () {
                  const accounts = await ethers.getSigners()
                  const attacker = accounts[1]
                  // not attacker.address, because we are not only connecting
                  // address, but account, and attacker is an account object
                  const attackerConnectedContract = await fundMe.connect(
                      attacker
                  )
                  await expect(
                      attackerConnectedContract.withdraw()
                  ).to.be.revertedWith("FundMe__NotOwner")
              })

              it("cheaperWithdraw testing...", async function () {
                  // Arrange
                  const accounts = await ethers.getSigners()
                  // then we can loop through these accounts, and have each
                  // account call the fund function with a for loop
                  // we'll start with first index of account because 0th index
                  // is going to be the deployer
                  for (let i = 1; i < 6; i++) {
                      // we need to call this connect function because right now
                      // our fundMe contract through ethers.getContract is connected
                      // to our deployer account and when we call a transaction
                      // with fundMe, the deployer is the account that is calling
                      // the transaction
                      // We need to create new objects to connect to all these
                      // different accounts
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      )
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  // Act
                  const transactionResponse = await fundMe.cheaperWithdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  // Assert
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  )

                  // Make sure that the s_funders are reset properly
                  await expect(fundMe.s_funders(0)).to.be.reverted

                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.s_addressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      )
                  }
              })
          })
      })
