const { Sequelize, DataTypes, Op } = require("sequelize");

const sequelize = new Sequelize("sqlite::memory:", {
  logging: false,
});

const Lease = sequelize.define(
  "Lease",
  {
    owner: { type: DataTypes.STRING, allowNull: false },
    dseq: { type: DataTypes.STRING, allowNull: false },
    state: { type: DataTypes.STRING, allowNull: false },
    datetime: { type: DataTypes.DATE, allowNull: false },
  },
  {
    // Other model options go here
  }
);

const Deployment = sequelize.define(
  "Deployment",
  {
    owner: { type: DataTypes.STRING, allowNull: false },
    dseq: { type: DataTypes.STRING, allowNull: false },
    state: { type: DataTypes.STRING, allowNull: false },
    datetime: { type: DataTypes.DATE, allowNull: false },
  },
  {
    // Other model options go here
  }
);

const Bid = sequelize.define('Bid', {
    owner: { type: DataTypes.STRING, allowNull: false },
    dseq: { type: DataTypes.STRING, allowNull: false },
    gseq: { type: DataTypes.NUMBER, allowNull: false },
    oeq: { type: DataTypes.NUMBER, allowNull: false },
    provider: { type: DataTypes.STRING, allowNull: false },
    state: { type: DataTypes.STRING, allowNull: false },
    price: { type: DataTypes.NUMBER, allowNull: false },
    datetime: { type: DataTypes.DATE, allowNull: false }
});

exports.init = async () => {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }

  await Lease.sync({ force: true });
  await Deployment.sync({ force: true });
  await Bid.sync({ force: true });
};

exports.addLease = async (lease) => {
  await Lease.create({
    owner: lease.lease.lease_id.owner,
    dseq: lease.lease.lease_id.dseq,
    state: lease.lease.state,
    datetime: blockHeightToDatetime(lease.lease.created_at),
  });
};

exports.addDeployment = async (deployment) => {
  await Deployment.create({
    owner: deployment.deployment.deployment_id.owner,
    dseq: deployment.deployment.deployment_id.dseq,
    state: deployment.deployment.state,
    datetime: blockHeightToDatetime(deployment.deployment.created_at),
  });
};

exports.addBid = async (bid) => {
    await Deployment.create({
        owner: bid.bid.bid_id.owner,
        dseq: bid.bid.bid_id.dseq,
        gseq: bid.bid.bid_id.gseq,
        oseq: bid.bid.bid_id.oseq,
        state: bid.bid.state,
        price: convertPrice(bid.bid.price),
        datetime: blockHeightToDatetime(bid.bid.created_at)
    });
}

function convertPrice(priceObj) {
    if (priceObj.denom === "uakt") {
        return parseInt(priceObj.amount);
    } else {
        throw "Invalid price denomination"; // TODO: Handle others
    }
}

exports.getTotalLeaseCount = async () => {
  return await Lease.count();
};
exports.getActiveLeaseCount = async () => {
  return await Lease.count({
    where: {
      state: "active",
    },
  });
};

exports.getActiveDeploymentCount = async () => {
  return await Deployment.count({
    where: {
      state: "active",
    },
  });
};

exports.getDeploymentCount = async () => {
  return await Deployment.count();
};

function blockHeightToDatetime(blockHeight) {
  const averageBlockTime = 6.174;
  const firstBlockDate = new Date("2021-03-08 15:00:00 UTC");
  let blockDate = new Date("2021-03-08 15:00:00 UTC");
  blockDate.setSeconds(
    firstBlockDate.getSeconds() + averageBlockTime * (blockHeight - 1)
  );

  return blockDate;
}
