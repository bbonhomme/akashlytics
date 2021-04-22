import React, { useState, useEffect } from "react";
import { useTable, useFilters, useExpanded } from 'react-table'

import AddressLink from "./AddressLink";
import SelectColumnFilter from "./SelectColumnFilter";
import DeploymentDetailRow from "./DeploymentDetailRow";

export default function DeploymentList() {
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

    useEffect(() => {
        getDeployments();
    }, []);

    async function getDeployments() {
        setIsLoading(true);
        const response = await fetch("/api/getDeployments");
        const body = await response.json();
        setIsLoading(false);
        setDeployments(body);
    }

    return (

        <div className="container">
            {deployments.length > 0 && (
                <table className="table table-dark caption-top" {...getTableProps()}>
                    <caption>Deployments</caption>
                    <thead>
                        {headerGroups.map(headerGroup => (
                            <tr {...headerGroup.getHeaderGroupProps()}>
                                {
                                    headerGroup.headers.map(column => (
                                        <th {...column.getHeaderProps()}>
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
    );
}