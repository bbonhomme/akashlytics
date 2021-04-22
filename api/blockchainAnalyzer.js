const fetch = require('node-fetch');
const dbProvider = require("./dbProvider");

const mainNet = "https://raw.githubusercontent.com/ovrclk/net/master/mainnet"
const testNet = "https://raw.githubusercontent.com/ovrclk/net/master/testnet"
const edgeNet = "https://raw.githubusercontent.com/ovrclk/net/master/edgenet"

const currentNet = mainNet;

exports.initialize = async () => {
    try {
        const nodeList = await loadNodeList();
        const node = pickRandomElement(nodeList);

        console.log("Selected node: " + node);

        const leases = await loadLeases(node);

        await dbProvider.init();
        
        console.log(`Inserting ${leases.length} leases into the database`);
        for (const lease of leases) {
            await dbProvider.addLease(lease);
        }

        const activeLeaseCount = await dbProvider.getActiveLeaseCount();
        console.log(`There is ${activeLeaseCount} active leases`);
    }
    catch (err) {
        console.error("Could not initialize", err);
    }
}

async function loadLeases(node) {
    // TODO: Load from api node

    const response = require("./data/leases.json");
    const leases = response.leases;

    console.log(`Found ${leases.length} leases`);

    return leases;
}

function pickRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

async function loadNodeList() {
    const nodeListUrl = currentNet + "/api-nodes.txt";
    console.log("Loading node list from: " + nodeListUrl);

    const response = await fetch(nodeListUrl);

    if (response.status !== 200) {
        console.error(response);
        throw "Could not load node list";
    }

    const content = await response.text();

    const nodeList = content.trim().split("\n");

    if (nodeList.length === 0) {
        throw "Found no node in the list";
    }

    console.log(`Found ${nodeList.length} nodes`);

    return nodeList;
}