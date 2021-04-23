"use strict";

const express = require("express");
const path = require("path");
const deployments = require("./data/deployments.json"); // TODO: If we keep, load from blockchainAnalyzer
const blockchainAnalyzer = require("./blockchainAnalyzer");

// Constants
const PORT = 3080;

// App
const app = express();

const users = [
  { id: 1, name: "Max" },
  { id: 2, name: "John" },
];

app.use(express.static(path.join(__dirname, "../app/build")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../app/build/index.html"));
});

app.get("/api/users", (req, res) => {
  // console.log("/api/users called!", req);
  res.json(users);
});

app.get("/api/getDeploymentCounts/", async (req, res) => {
  const activeDeploymentCount = blockchainAnalyzer.getActiveDeploymentCount();
  const deploymentCount = blockchainAnalyzer.getDeploymentCount();

  if (activeDeploymentCount != null) {
    res.send({ activeDeploymentCount, deploymentCount });
  } else {
    res.send(null);
  }
});

app.get("/api/getDeployments/", async (req, res) => {
  const data = deployments.deployments
    .map((x) => ({
      owner: x.deployment.deployment_id.owner,
      dseq: x.deployment.deployment_id.dseq,
      state: x.deployment.state,
      price: x.groups
        .flatMap((g) => g.group_spec.resources.map((r) => r.price))
        .map((p) => parseInt(p.amount))
        .reduce((a, b) => a + b),
      groups: x.groups.map((g) => ({
        gseq: g.group_id.gseq,
        state: g.state,
        name: g.group_spec.name,
        resources: g.group_spec.resources.map((r) => ({
          cpuUnits: r.resources.cpu.units.val,
          storageUnits: r.resources.storage.quantity.val,
          memoryUnits: r.resources.memory.quantity.val,
          count: r.count,
          price: parseInt(r.price.amount),
        })),
      })),
    }))
    .slice(0, 100);
  res.send(data);
});

app.listen(PORT, () => {
  console.log(`Server listening on the port::${PORT}`);
});

blockchainAnalyzer.initialize();
