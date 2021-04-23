import "./App.css";
import React, { useEffect, useState } from "react";
import ReactTooltip from 'react-tooltip';
import { FormattedNumber } from "react-intl";

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
              <p className="Number"><FormattedNumber value={deploymentCounts.activeDeploymentCount} /></p>
              <p className="Text">Active deployments</p>
            </div>
            <div className="Card">
              <p className="Number"><FormattedNumber value={deploymentCounts.deploymentCount} /></p>
              <p className="Text">Total deployments</p>
            </div>
            <div className="Card">
              <p className="Number"><FormattedNumber value={deploymentCounts.averagePrice / 1000000} /> akt</p>
              <p className="Text">
                Monthly cost for a small instance <i class="bi bi-question-circle-fill" data-tip data-for="instanceDef"></i>
                <ReactTooltip className="tooltip" id='instanceDef' place="bottom" type='error' effect='solid'>
                  Average based on these specs:<br />
                  cpu: 0.1<br />
                  memory: 512Mi<br />
                  storage: 512Mi
                </ReactTooltip>
              </p>
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
