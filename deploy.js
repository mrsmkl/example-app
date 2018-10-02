const fs = require('fs')

const ipfs = require('ipfs-api')("localhost", '5001', {protocol: 'http'})

let abi = JSON.parse(fs.readFileSync('./build/Scrypt.abi'))
let bin = fs.readFileSync('./build/Scrypt.bin')

let info = JSON.parse(fs.readFileSync('./scrypt-task/info.json'))

const host = "http://localhost:8545"

const Web3 = require('web3')
const web3 = new Web3(new Web3.providers.HttpProvider(host))

async function deploy() {

    //Upload file to IPFS
    let codeBuf = fs.readFileSync("./scrypt-task/task.wasm")

    let ipfsHash = (await ipfs.files.add([{content: codeBuf, path: "task.wasm"}]))[0].hash

    if (ipfsHash == info.ipfsHash) {
	throw "Wrong IPFS Hashes"
    }

    //Deploy contract with appropriate artifacts

    let networkName = await web3.eth.net.getNetworkType()

    let artifacts = JSON.parse(fs.readFileSync('./truebit-os/wasm-client/' + networkName + '.json'))

    let accounts = await web3.eth.getAccounts()

    let options = {from: accounts[0].toLowerCase(), gas: 2000000}

    let args = [
	artifacts.incentiveLayer.address.toLowerCase(),
	artifacts.tru.address.toLowerCase(),
	artifacts.fileSystem.address.toLowerCase(),
	info.ipfshash,
	info.codehash
    ]

    let contract = new web3.eth.Contract(abi)
    
    await contract.deploy({data: "0x" + bin, arguments: args}).send(options)
}

deploy()