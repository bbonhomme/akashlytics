import { Field, Type } from "protobufjs";

// Deployments

const DeploymentID = new Type("DeploymentID")
    .add(new Field("owner", 1, "string"))
    .add(new Field("dseq", 2, "uint64"));

export const MsgCloseDeployment = new Type("MsgCloseDeployment")
    .add(new Field("id", 1, "DeploymentID"))
    .add(DeploymentID);

const Coin = new Type("Coin")
    .add(new Field("denom", 1, "string"))
    .add(new Field("amount", 2, "string"));

const Endpoint = new Type("Endpoint")
    .add("kind", 1, "enum");

const Attribute = new Type("Attribute")
    .add("key", 1, "string")
    .add("value", 2, "string");

const ResourceValue = new Type("ResourceValue")
    .add("val", 1, "bytes");

const CPU = new Type("CPU")
    .add("units", 1, "ResourceValue")
    .add("attributes", 2, "Array.Attribute");

const Memory = new Type("Memory")
    .add("quantity", 1, "ResourceValue")
    .add("attributes", 2, "Array.Attribute");

const Storage = new Type("Storage")
    .add("quantity", 1, "ResourceValue")
    .add("attributes", 2, "Array.Attribute");

const ResourceUnits = new Type("ResourceUnits")
    .add(new Field("cpu", 1, "CPU"))
    .add(new Field("memory", 2, "Memory"))
    .add(new Field("storage", 3, "Storage"))
    .add(new Field("enpoints", 4, "Array.Endpoint"));

const Resource = new Type("Resource")
    .add(new Field("resources", 1, "ResourceUnits"))
    .add(new Field("count", 2, "uint32"))
    .add(new Field("price", 3, "Coin"));

const GroupSpec = new Type("GroupSpec")
    .add(new Field("name", 1, "string"))
    .add(new Field("requirements", 2, "PlacementRequirements"))
    .add(new Field("resources", 3, "Array.Resource"));

export const MsgCreateDeployment = new Type("MsgCreateDeployment")
    .add(new Field("id", 1, "DeploymentID"))
    .add(DeploymentID)
    .add(new Field("groups", 2, "GroupSpec"))
    .add(new Field("version", 3, "bytes"))
    .add(new Field("deposit", 4, "Coin"));

// Certificates

const CertificateID = new Type("CertificateID")
    .add(new Field("owner", 1, "string"))
    .add(new Field("serial", 2, "string"));

export const MsgRevokeCertificate = new Type("MsgRevokeCertificate")
    .add(new Field("id", 1, "CertificateID"))
    .add(CertificateID);

export const MsgCreateCertificate = new Type("MsgCreateCertificate")
    .add(new Field("owner", 1, "string"))
    .add(new Field("cert", 2, "bytes"))
    .add(new Field("pubkey", 3, "bytes"));