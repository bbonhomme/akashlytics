import logo from "./logo.svg";
import "./App.css";
import { useEffect, useState } from "react";

function App() {
  const [users, setUsers] = useState([]);

  // get the users
  useEffect(() => {
    async function getData() {
      const res = await fetch("/api/users");
      const body = await res.json();
      setUsers(body);
    }

    getData();
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

        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
