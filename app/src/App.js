import logo from "./logo.svg";
import "./App.css";
import React, { useEffect, useState } from "react";
import { useTable, useFilters, useExpanded } from 'react-table'

import SelectColumnFilter from "./SelectColumnFilter";
import DeploymentDetailRow from "./DeploymentDetailRow";

function AddressLink(props) {
  return <a href={"https://akash.bigdipper.live/account/" + props.address} target="_blank" rel="noopener noreferrer">{props.address}</a>
}

function App() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deployments, setDeployments] = useState([]);

  const columns = React.useMemo(() => [
    {
      id: 'expander',
      Cell: ({ row }) =>
        <span className="expandCell"
          {...row.getToggleRowExpandedProps()}
        >
          {row.isExpanded ? <i className="bi bi-dash"></i> : <i className="bi bi-plus"></i>}
        </span>
    },
    {
      Header: 'Owner',
      Cell: ({ value }) => <AddressLink address={value} />,
      accessor: 'owner',
      disableFilters: true
    },
    {
      Header: 'DSEQ',
      accessor: 'dseq',
      disableFilters: true
    },
    {
      Header: 'State',
      Filter: SelectColumnFilter,
      accessor: 'state'
    },
    {
      Header: "Price",
      Cell: ({ value }) => <>{value} uakt</>,
      accessor: "price",
      disableFilters: true
    }
  ], []);

  const tableInstance = useTable({
    columns,
    data: deployments,
    defaultCanFilter: false
  }, useFilters, useExpanded);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    visibleColumns
  } = tableInstance;

  useEffect(async () => {
    getDeployments();
  }, []);

  async function getDeployments() {
    setIsLoading(true);
    const response = await fetch("/api/getDeployments");
    const body = await response.json();
    setIsLoading(false);
    setDeployments(body);
  }

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

        <br />

        <div className="container">
          {deployments.length > 0 && (
            <table className="table table-dark caption-top" {...getTableProps()}>
              <caption>Deployments</caption>
              <thead>
                {headerGroups.map(headerGroup => (
                  <tr {...headerGroup.getHeaderGroupProps()}>
                    {
                      headerGroup.headers.map(column => (
                        <th {...column.getHeaderProps()}>{console.log(column)}
                          {column.render('Header')}
                          <div>{column.canFilter ? column.render('Filter') : null}</div>
                        </th>
                      ))}
                  </tr>
                ))}
              </thead>
              <tbody {...getTableBodyProps()}>
                {
                  rows.map(row => {
                    prepareRow(row);
                    return (
                      <React.Fragment {...row.getRowProps()}>
                        <tr className="tableRow">
                          {row.cells.map(cell => {
                            return (
                              <td {...cell.getCellProps()}>
                                {cell.render('Cell')}
                              </td>
                            )
                          })}
                        </tr>
                        {row.isExpanded ? (
                          <tr>
                            <td colSpan={visibleColumns.length}>
                              <DeploymentDetailRow deployment={row.original} />
                            </td>
                          </tr>
                        ) : null}
                      </React.Fragment>
                    )
                  })}
              </tbody>
            </table>
          )}
        </div>
      </header>
    </div>
  );
}

export default App;
