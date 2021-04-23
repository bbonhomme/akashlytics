import React from "react";

export default function DeploymentDetailRow(props) {
  const { deployment } = props;

  return (
    <>
      {deployment.groups.map((group) => (
        <>
          <p>
            Group: {group.name}
            <br />
            State: {group.state}
            <br />
            Resources:
          </p>
          <div className="row row-cols-1 row-cols-md-4 g-4">
            {group.resources.map((resource) => (
              <div className="col">
                <div className="card text-white bg-dark">
                  <div class="card-body">
                    {/* <h5 class="card-title">Group: </h5> */}
                    <p class="card-text">
                      CPU: {resource.cpuUnits}
                      <br />
                      Memory: {resource.memoryUnits}
                      <br />
                      Storage: {resource.memoryUnits}
                      <br />
                      Count: {resource.count}
                      <br />
                      Price: {resource.price} uakt
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ))}
    </>
  );
}
