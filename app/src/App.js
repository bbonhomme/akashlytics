import "./App.css";
import React, { useEffect, useState } from "react";
import ReactTooltip from "react-tooltip";
import clsx from 'clsx';
import { FormattedNumber } from "react-intl";

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

  const showAveragePrice = deploymentCounts && deploymentCounts.averagePrice > 0;

  return (
    <div className="App">
      <header className="App-header">
        <img src="/images/akash-network-akt-logo.png" className="App-logo" />
        <span>Akashlytics</span>
      </header>

      <div className="container App-body">
        {deploymentCounts !== null && (
          <div className="row">
            <div className={clsx("col-xs-12", { "col-lg-4": showAveragePrice, "col-lg-6": !showAveragePrice })}>
              <div className="Card">
                <p className="Number">
                  <FormattedNumber value={deploymentCounts.activeDeploymentCount} />
                </p>
                <p className="Text">Active deployments</p>
              </div>
            </div>

            <div className={clsx("col-xs-12", { "col-lg-4": showAveragePrice, "col-lg-6": !showAveragePrice })}>
              <div className="Card">
                <p className="Number">
                  <FormattedNumber value={deploymentCounts.deploymentCount} />
                </p>
                <p className="Text">Total deployments</p>
              </div>
            </div>

            {showAveragePrice && (
              <div className="col-xs-12 col-lg-4">
                <div className="Card">
                  <p className="Number">
                    <FormattedNumber value={deploymentCounts.averagePrice / 1000000} /> akt
                </p>
                  <p className="Text">
                    Monthly cost for a small instance{" "}
                    <i className="bi bi-question-circle-fill" data-tip data-for="instanceDef"></i>
                  </p>
                  <ReactTooltip
                    className="tooltip"
                    id="instanceDef"
                    place="bottom"
                    type="error"
                    effect="solid"
                  >
                    Average based on these specs:
                  <br />
                  cpu: 0.1
                  <br />
                  memory: 512Mi
                  <br />
                  storage: 512Mi
                </ReactTooltip>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <footer className="App-footer container">
        <img src="/images/powered-by-akash.png" className="img-fluid" />
      </footer>
    </div>
  );
}

export default App;
