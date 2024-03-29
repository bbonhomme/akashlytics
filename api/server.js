"use strict";

const express = require("express");
const path = require("path");
const blockchainAnalyzer = require("./blockchainAnalyzer");
const marketDataProvider = require("./marketDataProvider");
const dbProvider = require("./dbProvider");

// Constants
const PORT = 3080;

// App
const app = express();

app.use("/dist", express.static(path.join(__dirname, "../app/dist")));
app.use(express.static(path.join(__dirname, "../app/dist")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../app/dist/index.html"));
});

app.get("/api/getDeploymentCounts/", async (req, res) => {
  const activeDeploymentCount = blockchainAnalyzer.getActiveDeploymentCount();
  const deploymentCount = blockchainAnalyzer.getDeploymentCount();
  const averagePrice = blockchainAnalyzer.getAveragePrice();
  const totalResourcesLeased = blockchainAnalyzer.getTotalResourcesLeased();
  const lastRefreshDate = blockchainAnalyzer.getLastRefreshDate();
  const totalAKTSpent = blockchainAnalyzer.getTotalAKTSpent();
  const marketData = marketDataProvider.getAktMarketData();

  if (activeDeploymentCount != null) {
    res.send({
      activeDeploymentCount,
      deploymentCount,
      averagePrice,
      marketData,
      totalAKTSpent,
      totalResourcesLeased,
      lastRefreshDate,
    });
  } else {
    res.send(null);
  }
});

app.get("/api/getSnapshot/:id", async (req, res) => {
  if (!req.params) return res.send("Must specify a param.");

  const id = req.params.id;
  let snapshots = null;

  if (!id) return res.send("Must specify a valid snapshot.");

  switch (id) {
    case "activeDeployment":
      snapshots = blockchainAnalyzer.getActiveDeploymentSnapshots();
      break;
    case "totalAKTSpent":
      snapshots = blockchainAnalyzer.getTotalAKTSpentSnapshots();
      break;
    case "allTimeDeploymentCount":
      snapshots = blockchainAnalyzer.getAllTimeDeploymentCountSnapshots();
      break;
    case "compute":
      snapshots = blockchainAnalyzer.getComputeSnapshots();
      break;
    case "memory":
      snapshots = blockchainAnalyzer.getMemorySnapshots();
      break;
    case "storage":
      snapshots = blockchainAnalyzer.getStorageSnapshots();
      break;

    default:
      break;
  }

  if (snapshots != null) {
    res.send(snapshots);
  } else {
    res.send(null);
  }
});

app.get("/api/getAllSnapshots", async (req, res) => {
  const snapshots = await dbProvider.getAllSnapshots();

  res.send(snapshots);
});

app.get("/api/refreshData", async (req, res) => {
  const refreshed = await blockchainAnalyzer.refreshData();

  if (refreshed) {
    res.send("Data refreshed");
  } else {
    res.send("Ignored");
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../app/dist/index.html"));
});

app.listen(PORT, () => {
  console.log(`Server listening on the port::${PORT}`);
});

async function InitApp() {
  await blockchainAnalyzer.initialize(true);
  blockchainAnalyzer.startAutoRefresh();
  marketDataProvider.syncAtInterval();
}

InitApp();
