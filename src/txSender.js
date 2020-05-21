const { Api } = require('@cennznet/api');
const { randomAsU8a } = require('@cennznet/util');
const { Keyring } = require('@polkadot/keyring');
const express = require('express')
const Prometheus = require('prom-client')
const keyring = new Keyring({ type: 'sr25519' });

const app = express();
const port = process.env.PORT || 8080

const metricsInterval = Prometheus.collectDefaultMetrics()
const unFinalisedTx = new Prometheus.Gauge({
    name: 'unfinalised_transactions',
    help: 'current in-pool tx',
    labelNames: ['unfinalised_tx']
});

const successTx = new Prometheus.Gauge({
    name: 'successTx',
    help: 'TX with returned extrinsic successful',
    labelNames: ['successTx']
});

const failTX = new Prometheus.Gauge({
    name: 'failTX',
    help: 'TX with returned extrinsic failure',
    labelNames: ['failTX']
});

const txSent = new Prometheus.Gauge({
    name: 'sent_transactions',
    help: 'sent tx',
    labelNames: ['tx_sent']
});

const txProcessTimeDuration = new Prometheus.Histogram({
    name: 'tx_process_duration_ms',
    help: 'Duration of ws TX in ms',
    labelNames: ['Finalisation', 'route', 'code'],
    buckets: [10, 15, 20, 25, 30, 35, 40, 45, 50, 100, 150, 200]  // buckets for response time from 10ms to 200ms
});

app.get('/load', (req, res, next) => {

});
app.get('/metrics', (request, response) => {
    response.set('Content-Type', Prometheus.register.contentType);
    response.send(Prometheus.register.metrics());
});

async function main() {
    // await cryptoWaitReady();
    const api = await Api.create({
        provider: 'ws://0.0.0.0:8800'
    });

    const alice = keyring.addFromUri('//Alice', { name: 'Alcie' });
    const Bob = '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty';
    let receivers = []

    receivers.forEach(element => {
        console.log(`Receiver: ${element.address}`)
    });


    console.log(`Type of alice : ${typeof (alice)}`);

    let loop = 0;

    let nonce = await api.query.system.accountNonce("5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY");

    console.log(` Nonce value: ${String(nonce)} `);
    while (loop < 3000) {

        const receiver = keyring.addFromSeed(randomAsU8a(32)).address;
        const end = txProcessTimeDuration.startTimer();
        unFinalisedTx.inc();
        txSent.inc();
        let success = false;
        const unsub = await api.tx.genericAsset
            .transfer("16000", receiver, randomTxAmmount())
            .signAndSend(alice, { nonce: nonce }, async ({ events = [], status }) => {
                if (status.isFinalized) {
                    console.log(`Transaction included at blockHash ${status.asFinalized}`);

                    // Loop through Vec<EventRecord> to look for ExtrinsicSuccess
                    events.forEach(({ phase, event }) => {
                        console.log(`\t' ${phase}: ${event.section}.${event.method}:: ${event.data}`);
                        if (event.section == 'system' && event.method == 'ExtrinsicSuccess') {
                            success = true;
                        }
                    });

                    if (success == true) {
                        const seconds = end();
                        successTx.inc();
                    }else {
                        console.log(`Extrinsic failed at loop ${loop} `)
                        failTX.inc();
                    }
                    unFinalisedTx.dec();
                }
            });
        
        nonce++;
        loop = loop + 1;
        await sleepMs(1);
    }
}

function randomTxAmmount() {
    let ammount = Math.floor((1 - Math.random()) * 1000000);
    console.log(`TX ammount: ${ammount}`);
    return ammount;
}

function sleepMs(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

app.get('/metrics', (req, res) => {
    res.set('Content-Type', Prometheus.register.contentType)
    res.end(Prometheus.register.metrics())
})

const server = app.listen(port, async () => {
    console.log(`Test harness app listening on port ${port}!`);
    await main();
    //Graceful shutdown test harness and reset metrics
    await sleepMs(60000);
    clearInterval(metricsInterval);
    process.exit(0);
})