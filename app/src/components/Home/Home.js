import React, { useEffect, useState } from "react";
import ReactTooltip from "react-tooltip";
import clsx from "clsx";
import { FormattedNumber } from "react-intl";
import AktAmount from "../AktAmount/AktAmount";
import CircularProgress from "@material-ui/core/CircularProgress";

export function Home({ deploymentCounts }) {
  const showAktPrice = deploymentCounts && deploymentCounts.marketData;
  const showAveragePrice =
    deploymentCounts && deploymentCounts.marketData && deploymentCounts.averagePrice > 0;

  let tileClassName = "col-lg-6";
  if (showAktPrice) {
    tileClassName = "col-lg-4";
  }
  if (showAveragePrice) {
    tileClassName = "col-lg-3";
  }

  return (
    <div className="container App-body">
      <div className="row mb-4">
        <div className="col-lg-12">
          <h1 style={{ color: "white" }}>Network summary</h1>
        </div>
      </div>
      {deploymentCounts !== null ? (
        <div className="row">
          <div className={clsx("col-xs-12", tileClassName)}>
            <div className="Card">
              <p className="Number">
                <FormattedNumber value={deploymentCounts.activeDeploymentCount} />
              </p>
              <p className="Text">Active deployments</p>
            </div>
          </div>

          {deploymentCounts.marketData && (
            <div className={clsx("col-xs-12", tileClassName)}>
              <div className="Card">
                <p className="Number">
                  <FormattedNumber
                    style="currency"
                    currency="USD"
                    value={deploymentCounts.marketData.computedPrice}
                  />
                </p>
                <p className="Text">Current AKT Price</p>
              </div>
            </div>
          )}

          {showAveragePrice && (
            <div className={clsx("col-xs-12", tileClassName)}>
              <div className="Card">
                <p className="Number">
                  <FormattedNumber
                    style="currency"
                    currency="USD"
                    value={0.432 * deploymentCounts.marketData.computedPrice}
                  />
                  <small
                    style={{
                      fontWeight: "bold",
                      fontSize: 12,
                      display: "block",
                      marginTop: "-10px",
                    }}
                  >
                    (.432akt)
                  </small>
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

          <div className={clsx("col-xs-12", tileClassName)}>
            <div className="Card">
              <p className="Number">
                <FormattedNumber value={deploymentCounts.deploymentCount} />
              </p>
              <p className="Text">Total deployments</p>
            </div>
          </div>

          {deploymentCounts.totalResourcesLeased && (
            <>
              <div className="row mt-5 mb-4">
                <div className="col-lg-12">
                  <h1 style={{ color: "white" }}>Total resources currently leased</h1>
                </div>
              </div>
              <div className="row">
                <div className={clsx("col-xs-12 col-lg-4")}>
                  <div className="Card">
                    <p className="Number">
                      <FormattedNumber value={deploymentCounts.totalResourcesLeased.cpuSum / 1000} />
                      <small style={{ paddingLeft: "5px", fontWeight: "bold", fontSize: 16 }}>vCPUs</small>
                    </p>
                    <p className="text">Compute</p>
                  </div>
                </div>

                <div className={clsx("col-xs-12 col-lg-4")}>
                  <div className="Card">
                    <p className="Number">
                      <FormattedNumber value={deploymentCounts.totalResourcesLeased.memorySum / 1024 / 1024 / 1024} />
                      <small style={{ paddingLeft: "5px", fontWeight: "bold", fontSize: 16 }}>Go</small>
                    </p>
                    <p className="Text">Memory</p>
                  </div>
                </div>

                <div className={clsx("col-xs-12 col-lg-4")}>
                  <div className="Card">
                    <p className="Number">
                      <FormattedNumber value={deploymentCounts.totalResourcesLeased.storageSum / 1024 / 1024 / 1024} />
                      <small style={{ paddingLeft: "5px", fontWeight: "bold", fontSize: 16 }}>Go</small>
                    </p>
                    <p className="Text">Storage</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        <CircularProgress size={80} />
      )}
    </div>
  );
}
