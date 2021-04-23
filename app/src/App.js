import logo from "./logo.svg";
import "./App.css";
import React, { useEffect, useState } from "react";

import DeploymentList from "./DeploymentList";

function App() {
  const [deploymentCounts, setDeploymentCounts] = useState(null);

  // get the users
  useEffect(() => {
    async function getDeploymentCounts() {
      const res = await fetch("/api/getDeploymentCounts");
      const data = await res.json();

      if (data) {
        setDeploymentCounts(data);
      }
    }

    getDeploymentCounts();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <img src="/akash-network-akt-logo.png" className="Logo" />

        {deploymentCounts !== null && (
          <div style={{ display: "flex", alignItems: "center" }}>
            <div className="Card">
              <p className="Number">{deploymentCounts.activeDeploymentCount}</p>
              <p className="Text">Active deployments</p>
            </div>
            <div className="Card">
              <p className="Number">{deploymentCounts.deploymentCount}</p>
              <p className="Text">Total deployments</p>
            </div>
          </div>
        )}

        <br />

        <DeploymentList />
      </header>
    </div>
  );
}

export default App;
