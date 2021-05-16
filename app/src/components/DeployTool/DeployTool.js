import { Button } from "@material-ui/core";
import React, { useEffect, useState } from "react";
import { SigningStargateClient, MsgSend, MsgDelegate, makeSignDoc, AminoTypes } from "@cosmjs/stargate";
import { SigningCosmosClient } from "@cosmjs/launchpad";
import { DirectSecp256k1HdWallet, Registry, Writer, Coin, Tx } from "@cosmjs/proto-signing";
import { AminoMsgSend, AminoMsgDelegate } from "@cosmjs/amino";
import { Any } from "@cosmjs/stargate/build/codec/google/protobuf/any";
import protobuf from "protobufjs/minimal";
import { MsgCloseDeployment, MsgRevokeCertificate, MsgCreateCertificate, MsgCreateDeployment, MsgCreateLease, DeploymentID } from "./ProtoAkashTypes";
import { NewDeploymentData } from "./DeploymentUtils";

import DemoDeployYaml from "../../demo.deploy.yml";

import rsa from 'js-x509-utils';
var rs = require("jsrsasign");
const yaml = require('js-yaml');

const rpcEnpoint = "http://localhost:4242/http://rpc.akash.forbole.com";
const apiEndpoint = "http://localhost:4242/http://135.181.60.250:1317";
// const rpcEnpoint = "http://localhost:26656";
// const apiEndpoint = "http://localhost:1317";

const fee = {
    gas: "120000", // 200000 for create lease?
    amount: [{
        "denom": "akt",
        "amount": "0.0012"
    }]
}

async function getKeplr() {
    if (window.keplr) {
        return window.keplr;
    }

    if (document.readyState === "complete") {
        return window.keplr;
    }

    return new Promise((resolve) => {
        const documentStateChange = (event) => {
            if (
                event.target &&
                (event.target).readyState === "complete"
            ) {
                resolve(window.keplr);
                document.removeEventListener("readystatechange", documentStateChange);
            }
        };

        document.addEventListener("readystatechange", documentStateChange);
    });
}

const chainId = "akashnet-2";


const customRegistry = new Registry();
customRegistry.register("/akash.deployment.v1beta1.MsgCloseDeployment", MsgCloseDeployment);
customRegistry.register("/akash.deployment.v1beta1.MsgCreateDeployment", MsgCreateDeployment);
customRegistry.register("/akash.market.v1beta1.MsgCreateLease", MsgCreateLease);
customRegistry.register("/akash.cert.v1beta1.MsgRevokeCertificate", MsgRevokeCertificate);
customRegistry.register("/akash.cert.v1beta1.MsgCreateCertificate", MsgCreateCertificate);

export function DeployTool() {

    const [selectedWallet, setSelectedWallet] = useState(null);
    const [deployments, setDeployments] = useState([]);
    const [validCertificates, setValidCertificates] = useState([]);
    const [bids, setBids] = useState([]);

    useEffect(async () => {
        const keplr = await getKeplr();
        await keplr.enable(chainId);

        const offlineSigner = window.getOfflineSigner(chainId);

        const key = await keplr.getKey(chainId);
        const accounts = await offlineSigner.getAccounts();
        console.log(accounts);

        setSelectedWallet(key);

        loadDeployments(accounts[0].address);

        loadValidCertificates(accounts[0].address);
    }, []);

    async function loadDeployments(address) {
        const response = await fetch(apiEndpoint + "/akash/deployment/v1beta1/deployments/list?filters.owner=" + address);
        const deployments = await response.json();
        setDeployments(deployments.deployments.map(d => ({
            dseq: d.deployment.deployment_id.dseq,
            state: d.deployment.state
        })));
        console.log(deployments);
    }

    async function loadValidCertificates(owner) {
        const response = await fetch(apiEndpoint + "/akash/cert/v1beta1/certificates/list?filter.state=valid&filter.owner=" + owner);
        const data = await response.json();

        setValidCertificates(data.certificates);
    }

    async function closeDeployment(deployment) {
        const keplr = await getKeplr();

        const offlineSigner = window.getOfflineSigner(chainId);
        const accounts = await offlineSigner.getAccounts();
        debugger;

        const client = await SigningStargateClient.connectWithSigner(rpcEnpoint, offlineSigner, {
            registry: customRegistry
        });

        const closeJson = {
            "id": {
                "owner": selectedWallet.bech32Address,
                "dseq": parseInt(deployment.dseq)
            }
        };

        const closeDeploymentJson = {
            "typeUrl": "/akash.deployment.v1beta1.MsgCloseDeployment",
            "value": closeJson
        };

        const err = MsgCloseDeployment.verify(closeJson);

        await client.signAndBroadcast(selectedWallet.bech32Address, [closeDeploymentJson], fee, "Test Akashlytics");
    }

    async function createDeployment() {
        const fromAddress = selectedWallet.bech32Address;

        const flags = {};
        const response = await fetch(DemoDeployYaml);
        const txt = await response.text();
        const doc = yaml.load(txt);

        const dd = await NewDeploymentData(doc, flags, fromAddress); // TODO Flags

        const msg = {
            id: dd.deploymentId,
            groups: dd.groups,
            version: dd.version,
            deposit: dd.deposit
        };

        const txData = {
            "typeUrl": "/akash.deployment.v1beta1.MsgCreateDeployment",
            "value": msg
        }

        const err = MsgCreateDeployment.verify(msg);
        // const encoded = MsgCreateDeployment.fromObject(msg);
        // const decoded = MsgCreateDeployment.toObject(encoded);

        if (err) throw err;

        const offlineSigner = window.getOfflineSigner(chainId);

        const client = await SigningStargateClient.connectWithSigner(rpcEnpoint, offlineSigner, {
            registry: customRegistry
        });

        await client.signAndBroadcast(fromAddress, [txData], fee);
    }

    async function revokeCertificate(cert) {
        const offlineSigner = window.getOfflineSigner(chainId);

        const client = await SigningStargateClient.connectWithSigner(rpcEnpoint, offlineSigner, {
            registry: customRegistry
        });

        const revokeCertificateJson = {
            "typeUrl": "/akash.cert.v1beta1.MsgRevokeCertificate",
            "value": {
                "id": {
                    "owner": selectedWallet.bech32Address,
                    "serial": cert.serial
                }
            }
        };

        await client.signAndBroadcast(selectedWallet.bech32Address, [revokeCertificateJson], fee, "Test Akashlytics");
    }

    async function createCertificate() {
        const fromAddress = selectedWallet.bech32Address;
        const notBefore = new Date();
        let notAfter = new Date();
        notAfter.setFullYear(notBefore.getFullYear() + 1);

        // STEP1. generate a key pair
        var kp = rs.KEYUTIL.generateKeypair("EC", "secp256r1");
        var prv = kp.prvKeyObj;
        var pub = kp.pubKeyObj;
        var prvpem = rs.KEYUTIL.getPEM(prv, "PKCS8PRV");
        var pubpem = rs.KEYUTIL.getPEM(pub, "PKCS8PUB").replaceAll("PUBLIC KEY", "EC PUBLIC KEY");

        // STEP2. specify certificate parameters
        var cert = new rs.KJUR.asn1.x509.Certificate({
            version: 3,
            serial: { int: Math.floor((new Date()).getTime() * 1000) },
            issuer: { str: "/CN=" + fromAddress },
            notbefore: notBefore,
            notafter: notAfter,
            subject: { str: "/CN=" + fromAddress },
            //subjectAltName: {array: [{oid: "2.23.133.2.6", value: "v0.0.1"}]},
            sbjpubkey: pub, // can specify public key object or PEM string
            ext: [
                { extname: "keyUsage", critical: true, names: ["keyEncipherment", "dataEncipherment"] },
                {
                    extname: "extKeyUsage",
                    array: [{ name: 'clientAuth' }]
                },
                { extname: "basicConstraints", cA: true, critical: true }
            ],
            sigalg: "SHA256withECDSA",
            cakey: prv // can specify private key object or PEM string
        });

        const crtpem = cert.getPEM();

        // STEP3. show PEM strings of keys and a certificate
        console.log(prvpem);
        console.log(pubpem);
        console.log(crtpem);

        const createCertificateMsg = {
            "typeUrl": "/akash.cert.v1beta1.MsgCreateCertificate",
            "value": {
                owner: fromAddress,
                cert: window.forge.util.encode64(crtpem),
                pubkey: window.forge.util.encode64(pubpem)
            }
        }

        const offlineSigner = window.getOfflineSigner(chainId);

        const client = await SigningStargateClient.connectWithSigner(rpcEnpoint, offlineSigner, {
            registry: customRegistry
        });

        await client.signAndBroadcast(selectedWallet.bech32Address, [createCertificateMsg], fee, "Test Akashlytics");
    }

    async function loadBids(deployment) {
        const response = await fetch(apiEndpoint + "/akash/market/v1beta1/bids/list?filters.owner=" + selectedWallet.bech32Address + "&filters.dseq=" + deployment.dseq);
        const data = await response.json();

        setBids(data.bids.map(b => ({
            owner: b.bid.bid_id.owner,
            provider: b.bid.bid_id.provider,
            dseq: b.bid.bid_id.dseq,
            gseq: b.bid.bid_id.gseq,
            oseq: b.bid.bid_id.oseq,
            price: b.bid.price,
            state: b.bid.state
        })));
    }

    async function acceptBid(bid) {
        const offlineSigner = window.getOfflineSigner(chainId);

        const client = await SigningStargateClient.connectWithSigner(rpcEnpoint, offlineSigner, {
            registry: customRegistry
        });

        const createLeaseMsg = {
            "typeUrl": "/akash.market.v1beta1.MsgCreateLease",
            "value": {
                "bid_id": {
                    "owner": bid.owner,
                    "dseq": bid.dseq,
                    "gseq": bid.gseq,
                    "oseq": bid.oseq,
                    "provider": bid.provider
                }
            }
        };

        await client.signAndBroadcast(selectedWallet.bech32Address, [createLeaseMsg], fee, "Test Akashlytics");
    }

    return (
        <div className="container text-on-black">
            {selectedWallet && (
                <>
                    <h1>{selectedWallet.name}</h1>
                    <h2>{selectedWallet.bech32Address}</h2>

                    <h2>Deployments</h2>
                    {deployments.map(deployment => (
                        <div key={deployment.dseq}>
                            DSEQ: {deployment.dseq}&nbsp;
                            {deployment.state}
                            {deployment.state === "active" && (
                                <>
                                    <Button color="primary" onClick={() => loadBids(deployment)}>View Bids</Button>
                                    <Button color="primary" onClick={() => closeDeployment(deployment)}>Close</Button>
                                </>
                            )}
                        </div>
                    ))}

                    <Button color="primary" onClick={() => createDeployment()}>Create Deployment</Button>

                    <h2>Certificates</h2>
                    {validCertificates.length > 0 ?
                        validCertificates.map(cert => (
                            <div key={cert.serial}>
                                {cert.serial}
                                <Button color="primary" onClick={() => revokeCertificate(cert)}>Revoke</Button>
                            </div>
                        )) : (
                            <div>
                                <Button color="primary" onClick={() => createCertificate()}>Create Certificate</Button>
                            </div>
                        )}
                    <br />

                    <h2>Bids</h2>
                    {bids.map(bid => (
                        <div key={bid.provider}>
                            Provider: {bid.provider}&nbsp;
                            Price: {bid.price.amount}{bid.price.denom}&nbsp;
                            &nbsp;&nbsp;{bid.state}
                            {bid.state === "open" && <Button color="primary" onClick={() => acceptBid(bid)}>Accept</Button>}
                        </div>
                    ))}
                </>
            )}
        </div>
    )
}