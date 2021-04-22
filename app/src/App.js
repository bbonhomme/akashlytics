import logo from "./logo.svg";
import "./App.css";
import React, { useEffect, useState } from "react";

import DeploymentList from "./DeploymentList";

function App() {
  const [users, setUsers] = useState([]);
  const [activeDeploymentCount, setActiveDeploymentCount] = useState(null);

  // get the users
  useEffect(() => {
    async function getData() {
      const res = await fetch("/api/users");
      const body = await res.json();
      setUsers(body);
    }

    async function getActiveDeploymentCount() {
      const res = await fetch("/api/getActiveDeploymentCount");
      const data = await res.text();

      if (data) {
        setActiveDeploymentCount(parseInt(data));
      }
    }

    getData();
    getActiveDeploymentCount();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>Hey this hosted on Akash!</p>

        {users.length > 0 && (
          <ul>
            {users.map((u) => {
              return <li key={u.id}>{u.name}</li>;
            })}
          </ul>
        )}

        <br />

        {activeDeploymentCount !== null && <p>There is {activeDeploymentCount} active deployments</p>}

        <br />

        <DeploymentList />
      </header>
    </div>
  );
}

export default App;
