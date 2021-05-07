import React, { useEffect, useState } from "react";
import { ResponsiveLine } from '@nivo/line'
import { FormattedDate } from "react-intl";

export default function ActiveDeploymentCountGraph(props) {
    const graphData = props.data ? [
        {
            "id": "activeDeploymentCount",
            "color": "rgb(1,0,0)",
            "data": props.data.map(snapshot => ({
                x: snapshot.date,
                y: snapshot.average
            }))
        }
    ] : null;

    const theme = {
        "textColor": "#FFFFFF",
        "fontSize": 14,
        "axis": {
            "domain": {
                "line": {
                    "stroke": "#FFFFFF",
                    "strokeWidth": 1
                }
            },
            "ticks": {
                "line": {
                    "stroke": "#FFFFFF",
                    "strokeWidth": 1
                }
            }
        },
        "grid": {
            "line": {
                "stroke": "#FFFFFF",
                "strokeWidth": .5
            }
        }
    };

    const maxValue =  props.data && props.data.map(x => x.max).reduce((a, b) => a > b ? a : b);

    return (

        <div style={{ height: "400px" }}>
            {props.data && (
                <ResponsiveLine
                    theme={theme}
                    data={graphData}
                    margin={{ top: 50, right: 60, bottom: 50, left: 60 }}
                    xScale={{ type: 'point' }}
                    yScale={{ type: 'linear', min: 0, max: maxValue + 5 }}
                    yFormat=" >-1d"
                    axisBottom={{format:(dateStr) => <FormattedDate value={new Date(dateStr)} day="numeric" month="long" />}}
                    axisTop={null}
                    axisRight={null}
                    colors={"#e41e13"}
                    pointSize={15}
                    pointBorderColor="#e41e13"
                    pointColor={"#ffffff"}
                    pointBorderWidth={3}
                    pointBorderColor={{ from: 'serieColor' }}
                    pointLabelYOffset={-15}
                    enablePointLabel={false}
                    isInteractive={true}
                    tooltip={props => <div className="graphTooltip">{props.point.data.y}</div>}
                    useMesh={true}
                />

            )}
        </div>
    );
}