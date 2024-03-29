import "./App.css";
import React, { useEffect, useState } from "react";
import { useSnackbar } from "notistack";
import { copyTextToClipboard } from "../../shared/utils/copyClipboard";
import { IconButton } from "@material-ui/core";
import CloseIcon from "@material-ui/icons/Close";
import FileCopyIcon from "@material-ui/icons/FileCopy";
import { Helmet } from "react-helmet-async";
import { Header } from "../Header";
import { Switch, Route } from "react-router-dom";
import { Home } from "../Home";
import { PriceCompare } from "../PriceCompare";
import { Faq } from "../Faq";
import { makeStyles } from "@material-ui/core/styles";
import { Graph } from "../Graph";
import { useMediaQueryContext } from "@src/context/MediaQueryProvider";
import clsx from "clsx";
import { useDashboardData } from "@src/hooks/queries/useDashboardData";

const donationAddress = "akash13265twfqejnma6cc93rw5dxk4cldyz2zyy8cdm";

const useStyles = makeStyles((theme) => ({
  link: {
    fontWeight: "bold",
    textDecoration: "underline",
  },
  appBody: {
    paddingTop: 80,
    paddingBottom: 100,
  },
  appBodySmall: {
    paddingTop: 25,
    paddingBottom: 50,
  },
  snackbarButton: {
    color: "white",
  },
}));

export function App() {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const { data: deploymentCounts, status } = useDashboardData();

  const mediaQuery = useMediaQueryContext();
  const classes = useStyles();

  const onDonationClick = () => {
    copyTextToClipboard(donationAddress);

    const action = (key) => (
      <React.Fragment>
        <IconButton
          onClick={() => {
            closeSnackbar(key);
          }}
          className={classes.snackbarButton}
        >
          <CloseIcon />
        </IconButton>
      </React.Fragment>
    );

    enqueueSnackbar("Address copied!", {
      anchorOrigin: { vertical: "top", horizontal: "right" },
      variant: "success",
      action,
      autoHideDuration: 3000,
    });
  };

  return (
    <div>
      <Helmet defaultTitle="Akashlytics" titleTemplate="Akashlytics - %s" />

      <Header />

      <div className={clsx(classes.appBody, { [classes.appBodySmall]: mediaQuery.smallScreen })}>
        <Switch>
          <Route path="/faq">
            <Faq />
          </Route>
          <Route path="/price-compare">
            <PriceCompare marketData={deploymentCounts && deploymentCounts.marketData} />
          </Route>
          <Route path="/graph/:snapshot">
            <Graph />
          </Route>
          <Route path="/">
            <Home deploymentCounts={deploymentCounts} />
          </Route>
        </Switch>
      </div>

      <footer className="App-footer container">
        <img
          src="/images/powered-by-akash.png"
          className="img-fluid"
          style={{ marginBottom: 50 }}
          alt="Powered by Akash logo"
        />
        <p className="text-white mb-5">(Yes, hosted on akash!)</p>

        <p className="text-on-black">
          Akashlytics is developed to help the community have a better insight on its decentralized
          cloud computing network.
        </p>
        <p className="text-on-black">
          It's also done in my spare time, so any donation would help tremendously! 🍻
        </p>

        <div className="chip clickable donation" onClick={onDonationClick}>
          <span style={{ marginRight: 15 }}>{donationAddress}</span>
          <FileCopyIcon fontSize="small" />
        </div>

        <p className="text-on-black">
          If you have great ideas on how to improve this app, let me know!{" "}
          <a className={classes.link} href="mailto:ideas@akashlytics.com">
            ideas@akashlytics.com
          </a>
        </p>

        <p className="text-on-black mt-5">
          <small>Version: {process.env.PACKAGE_VERSION}</small>
        </p>
      </footer>
    </div>
  );
}
