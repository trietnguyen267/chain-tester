const { Api } = require('@cennznet/api');
const { randomAsU8a } = require('@cennznet/util');
const { Keyring } = require('@polkadot/keyring');

const keyring = new Keyring({ type: 'sr25519' });




async function main() {
    // await cryptoWaitReady();
    const api = await Api.create({
        provider: 'ws://0.0.0.0:8800'
    });

    const alice = keyring.addFromUri('//Alice', { name: 'Alcie' });
    const Bob = '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty';
    let receivers = []
    let n = 0;

    receivers.forEach(element => {
        console.log(`Receiver: ${element.address}`)
    });


    console.log(`Type of alice : ${typeof (alice)}`);

    let loop = 0;
    let variation = Math.random(1, 15);
    let hashes = [];

    let nonce = await api.query.system.accountNonce("5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY");

    console.log(` Nonce value: ${String(nonce)} `);
    while (loop < 10000) {
        // console.log(alice)
        const signedBlock = await api.rpc.chain.getBlock();
        // get current block height and hash
        const currentHeight = signedBlock.block.header.number;
        const blockHash = signedBlock.block.header.hash;

        const receiver = keyring.addFromSeed(randomAsU8a(32)).address;
        let extrinsic = api.tx.genericAsset
                        .transfer("16000", receiver, randomTxAmmount())
                        .signAndSend(alice, { nonce: nonce });

        nonce++;
        console.log(`Nonce now is: ${nonce}`)

        loop = loop + 1;
        console.log('Current loop: ' + loop);
    }

    await sleepMs(2000);
    await console.log(hashes);

}

function randomTxAmmount() {
    let ammount = Math.floor((1 - Math.random()) * 1000000);
    console.log(`TX ammount: ${ammount}`);
    return ammount;
}

function sleepMs(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

main();
