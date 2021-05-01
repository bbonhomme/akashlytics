"use strict";

const express = require("express");
const path = require("path");
const blockchainAnalyzer = require("./blockchainAnalyzer");

// Constants
const PORT = 3080;

// App
const app = express();

app.use(express.static(path.join(__dirname, "../app/build")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../app/build/index.html"));
});

app.get("/api/getDeploymentCounts/", async (req, res) => {
  const activeDeploymentCount = blockchainAnalyzer.getActiveDeploymentCount();
  const deploymentCount = blockchainAnalyzer.getDeploymentCount();
  const averagePrice = blockchainAnalyzer.getAveragePrice();
  const lastRefreshDate = blockchainAnalyzer.getLastRefreshDate();

  if (activeDeploymentCount != null) {
    res.send({ activeDeploymentCount, deploymentCount, averagePrice, lastRefreshDate });
  } else {
    res.send(null);
  }
});

app.get("/api/refreshData", async (req, res) => {
  const refreshed = await blockchainAnalyzer.refreshData();

  if (refreshed) {
    res.send("Data refreshed");
  } else {
    res.send("Ignored");
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on the port::${PORT}`);
});

blockchainAnalyzer.initialize();
blockchainAnalyzer.startAutoRefresh();
