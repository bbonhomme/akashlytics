

const rpcEnpoint = "http://localhost:4242/http://rpc.akash.forbole.com";
const apiEndpoint = "http://localhost:4242/http://135.181.60.250:1317";
async function getCurrentHeight() {
    const response = await fetch(apiEndpoint + "/blocks/latest");
    const data = await response.json();

    const height = parseInt(data.block.header.height); // TODO parseInt?
    return height;
}


function ParseServiceProtocol(input) {
    let result;

    // This is not a case sensitive parse, so make all input
    // uppercase
    if (input) {
        input = input.toUpperCase();
    }

    switch (input) {
        case "TCP", "", undefined: // The empty string (no input) implies TCP
            result = "TCP";
            break;
        case "UDP":
            result = "UDP";
            break;
        default:
            throw "ErrUnsupportedServiceProtocol";
    }

    return result;
}

function parseSizeStr(str) {
    const suffixPos = str.indexOf("Mi");// Handle other suffix
    const numberStr = str.substring(0, suffixPos);
    const result = parseInt(numberStr) * 1024 * 1024;
    return result.toString();
}

// Port of: func (sdl *v2ComputeResources) toResourceUnits() types.ResourceUnits
function toResourceUnits(computeResources) {
    if (!computeResources) return {};
debugger;
    let units = {};
    if (computeResources.cpu) {
        units.cpu = {
            units: { val: (computeResources.cpu.units * 1000).toString() },
            //attributes: computeResources.cpu.attributes TODO
        }
    }
    if (computeResources.memory) {
        units.memory = {
            quantity: { val: parseSizeStr(computeResources.memory.size) },
            //attributes: computeResources.memory.attributes TODO
        }
    }
    if (computeResources.storage) {
        units.storage = {
            quantity: { val: parseSizeStr(computeResources.storage.size) },
            //attributes: computeResources.storage.attributes TODO
        }
    }

    return units;
}

// Port of:    func (sdl *v2) Manifest() (manifest.Manifest, error
function Manifest(yamlJson) {
    let groups = {};

    Object.keys(yamlJson.services).forEach(svcName => {
        const svc = yamlJson.services[svcName];
        const depl = yamlJson.deployment[svcName];

        Object.keys(depl).forEach(placementName => {
            const svcdepl = depl[placementName];
            let group = groups[placementName];

            if (!group) {
                group = {
                    name: placementName,
                    services: []
                };
                groups[placementName] = group;
            }

            const compute = yamlJson.profiles.compute[svcdepl.profile];

            const msvc = {
                name: svcName,
                image: svc.image,
                args: svc.args,
                env: svc.env,
                resources: toResourceUnits(compute.resources),
                count: svcdepl.count,
                expose: []
            };

            svc.expose.forEach((expose) => {
                const proto = ParseServiceProtocol(expose.proto);

                if (expose.to && expose.to.length > 0) {
                    expose.to.forEach(to => {
                        msvc.expose.push({
                            service: to.service,
                            port: expose.port,
                            externalPort: expose.as,
                            proto: proto,
                            global: to.global,
                            hosts: expose.accept && expose.accept.items
                        });
                    })
                } else {
                    msvc.expose.push({
                        service: "",
                        port: expose.port,
                        externalPort: expose.as,
                        proto: proto,
                        global: false,
                        hosts: expose.accept.items
                    });
                }
            });

            msvc.expose = msvc.expose.sort((a, b) => {
                if (a.service != b.service) {
                    return a.service < b.service;
                }
                if (a.port != b.port) {
                    return a.port < b.port;
                }
                if (a.proto != b.proto) {
                    return a.proto < b.proto;
                }
                if (a.global != b.global) {
                    return a.global < b.global;
                }
                return false;
            });

            group.services.push(msvc);
        })
    });

    let names = Object.keys(groups);
    names = names.sort((a, b) => a < b);

    let result = names.map(name => groups[name]);
    return result;
}

function shouldBeIngress(expose) {
    return expose.proto == "TCP" && expose.global && 80 == exposeExternalPort(expose);
}

function exposeExternalPort(expose) {
    if (expose.externalPort === 0) {
        return expose.port;
    }

    return expose.externalPort;
}

function sortKeys(obj_1) {
    var key = Object.keys(obj_1)
        .sort(function order(key1, key2) {
            if (key1 < key2) return -1;
            else if (key1 > key2) return +1;
            else return 0;
        });

    // Taking the object in 'temp' object
    // and deleting the original object.
    var temp = {};

    for (var i = 0; i < key.length; i++) {
        temp[key[i]] = obj_1[key[i]];
        delete obj_1[key[i]];
    }

    // Copying the object from 'temp' to 
    // 'original object'.
    for (var i = 0; i < key.length; i++) {
        obj_1[key[i]] = temp[key[i]];
    }
    return obj_1;
}

function DeploymentGroups(yamlJson) {
    let groups = {};

    Object.keys(yamlJson.services).forEach(svcName => {
        const svc = yamlJson.services[svcName];
        const depl = yamlJson.deployment[svcName];

        Object.keys(depl).forEach(placementName => {
            const svcdepl = depl[placementName];
            const compute = yamlJson.profiles.compute[svcdepl.profile];
            const infra = yamlJson.profiles.placement[placementName];
            const price = infra.pricing[svcdepl.profile];
            price.amount = price.amount.toString(); // Interpreted as number otherwise

            let group = groups[placementName];
            
            if (!group) {
                group = {
                    name: placementName,
                    requirements: {
                        attributes: Object.keys(infra.attributes).map(key => ({ key: key, value: infra.attributes[key] })),
                        signed_by: {
                            all_of: infra.signedBy.allOf,
                            any_of: infra.signedBy.anyOf
                        }
                    },
                    resources: []
                };

                group.requirements.attributes = group.requirements.attributes.sort((a, b) => a.key < b.key);

                groups[group.name] = group;
            }


            const resources = {
                resources: toResourceUnits(compute.resources), // Chanded resources => unit
                price: price,
                count: svcdepl.count
            };

            let endpoints = [];

            svc.expose.forEach((expose) => {
                expose.to.forEach(to => {
                    if (to.global) {
                        const proto = ParseServiceProtocol(expose.proto);

                        let v = {
                            port: expose.port,
                            externalPort: expose.as,
                            proto: proto,
                            service: to.service,
                            global: to.global,
                            hosts: expose.accept?.items
                        };

                        // TODO Enum
                        const Endpoint_SHARED_HTTP = 0;
                        const Endpoint_RANDOM_PORT = 1;

                        let kind = Endpoint_RANDOM_PORT;

                        if (shouldBeIngress(v)) {
                            kind = Endpoint_SHARED_HTTP;
                        }

                        endpoints.push({ kind: kind });
                    }
                });

                resources.resources.endpoints = endpoints;
                group.resources.push(resources);
            });
        });
    });

    let names = Object.keys(groups);
    names = names.sort((a, b) => a < b);

    let result = names.map(name => groups[name]);
    return result;
}

// https://github.com/cosmos/cosmos-sdk/blob/9fd866e3820b3510010ae172b682d71594cd8c14/types/utils.go#L29
function SortJSON(jsonStr) {
    return JSON.stringify(JSON.parse(jsonStr));
}

function _arrayBufferToBase64(buffer) {
    var binary = '';
    var bytes = new Uint8Array(buffer);
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

// https://github.com/ovrclk/akash/blob/04e7a7667dd94b5a15fa039e4f7df5c9ad93be4f/sdl/sdl.go#L120
async function ManifestVersion(manifest) {
    var enc = new TextEncoder();
    let m = JSON.stringify(manifest);
    let sortedBytes = enc.encode(SortJSON(m));

    let sum = await crypto.subtle.digest('SHA-256', sortedBytes);

    let base64 = _arrayBufferToBase64(sum);

    return base64;
}

// https://github.com/ovrclk/akash/blob/04e7a7667dd94b5a15fa039e4f7df5c9ad93be4f/x/deployment/client/cli/flags.go#L51
function DeploymentIDFromFlagsForOwner(flags, owner) {
    let id = {
        owner: owner,
    };

    //TODO
    // if id.DSeq, err = flags.GetUint64("dseq"); err != nil {
    //     return id, err
    // }

    return id;
}


function DepositFromFlags(flags) {
    // let val = flags["deposit"];

    // if(!val) return {};

    // return ParseCoinNormalized(val)
    // TODO
    return {
        "denom": "uakt",
        "amount": "5000000"
    };
}

export async function NewDeploymentData(yamlJson, flags, fromAddress) {
    const groups = DeploymentGroups(yamlJson);
    const mani = Manifest(yamlJson);
    const ver = await ManifestVersion(mani);
    const id = DeploymentIDFromFlagsForOwner(flags, fromAddress); // TODO: handle flags
    const deposit = DepositFromFlags();

    if (!id.dseq) {
        id.dseq = (await getCurrentHeight());
    }

    return {
        sdl: yamlJson,
        manifest: mani,
        groups: groups,
        deploymentId: id,
        orderId: [],
        leaseId: [],
        version: ver,
        deposit: deposit
    };
}