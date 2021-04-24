const { Sequelize, DataTypes, Op, Deferrable } = require("sequelize");
const { averageBlockTime } = require("./constants");

const sequelize = new Sequelize("sqlite::memory:", {
  logging: false,
  define: {
    freezeTableName: true,
  }
});

const Lease = sequelize.define(
  "lease",
  {
    deploymentId: {
      type: DataTypes.UUID,
      references: { model: "deployment", key: "id" }
    },
    owner: { type: DataTypes.STRING, allowNull: false },
    dseq: { type: DataTypes.STRING, allowNull: false },
    state: { type: DataTypes.STRING, allowNull: false },
    price: { type: DataTypes.NUMBER, allowNull: false },
    datetime: { type: DataTypes.DATE, allowNull: false }
  });

const Deployment = sequelize.define(
  "deployment",
  {
    id: { type: DataTypes.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
    owner: { type: DataTypes.STRING, allowNull: false },
    dseq: { type: DataTypes.STRING, allowNull: false },
    state: { type: DataTypes.STRING, allowNull: false },
    datetime: { type: DataTypes.DATE, allowNull: false }
  });

const DeploymentGroup = sequelize.define('deploymentGroup', {
  id: { type: DataTypes.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
  deploymentId: {
    type: DataTypes.UUID,
    references: { model: "deployment", key: "id" }
  },
  owner: { type: DataTypes.STRING, allowNull: false },
  dseq: { type: DataTypes.STRING, allowNull: false },
  gseq: { type: DataTypes.NUMBER, allowNull: false },
  state: { type: DataTypes.STRING, allowNull: false },
  datetime: { type: DataTypes.DATE, allowNull: false }
});

const DeploymentGroupResource = sequelize.define('deploymentGroupResource', {
  deploymentGroupId: {
    type: DataTypes.UUID,
    references: { model: "deploymentGroup", key: "id" }
  },
  cpuUnits: { type: DataTypes.STRING, allowNull: true },
  memoryQuantity: { type: DataTypes.STRING, allowNull: true },
  storageQuantity: { type: DataTypes.STRING, allowNull: true },
  count: { type: DataTypes.NUMBER, allowNull: false },
  price: { type: DataTypes.NUMBER, allowNull: false }
});

const Bid = sequelize.define('bid', {
  owner: { type: DataTypes.STRING, allowNull: false },
  dseq: { type: DataTypes.STRING, allowNull: false },
  gseq: { type: DataTypes.NUMBER, allowNull: false },
  oseq: { type: DataTypes.NUMBER, allowNull: false },
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

  await Lease.sync({ force: true })
  await Deployment.sync({ force: true });
  await DeploymentGroup.sync({ force: true });
  await DeploymentGroupResource.sync({ force: true });
  await Bid.sync({ force: true });

  Deployment.hasMany(DeploymentGroup);
  DeploymentGroup.belongsTo(Deployment, { foreignKey: "deploymentId" });

  DeploymentGroup.hasMany(DeploymentGroupResource);
  DeploymentGroupResource.belongsTo(DeploymentGroup, { foreignKey: "deploymentGroupId" });

  Deployment.hasOne(Lease, { foreignKey: "deploymentId" });
  Lease.belongsTo(Deployment);
}

exports.addLease = async (lease) => {
  const createdLease = await Lease.create({
    owner: lease.lease.lease_id.owner,
    dseq: lease.lease.lease_id.dseq,
    state: lease.lease.state,
    price: convertPrice(lease.lease.price),
    datetime: blockHeightToDatetime(lease.lease.created_at)
  });

  createdLease.setDeployment(await Deployment.findOne({
    where: {
      owner: lease.lease.lease_id.owner,
      dseq: lease.lease.lease_id.dseq
    }
  }));
};

exports.addDeployment = async (deployment) => {
  const createdDeployment = await Deployment.create({
    owner: deployment.deployment.deployment_id.owner,
    dseq: deployment.deployment.deployment_id.dseq,
    state: deployment.deployment.state,
    datetime: blockHeightToDatetime(deployment.deployment.created_at),
  });

  for (const group of deployment.groups) {
    const createdGroup = await createdDeployment.createDeploymentGroup({
      owner: group.group_id.owner,
      dseq: group.group_id.dseq,
      gseq: group.group_id.gseq,
      state: group.state,
      datetime: blockHeightToDatetime(group.created_at)
    });

    for (const resource of group.group_spec.resources) {
      await createdGroup.createDeploymentGroupResource({
        cpuUnits: resource.resources.cpu.units.val,
        memoryQuantity: resource.resources.memory.quantity.val,
        storageQuantity: resource.resources.storage.quantity.val,
        count: resource.count,
        price: convertPrice(resource.price)
      });
    }
  }
};

exports.addBid = async (bid) => {
  await Bid.create({
    owner: bid.bid.bid_id.owner,
    dseq: bid.bid.bid_id.dseq,
    gseq: bid.bid.bid_id.gseq,
    oseq: bid.bid.bid_id.oseq,
    provider: bid.bid.bid_id.provider,
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
      "$lease.state$": "active"
    },
    include: Lease
  });
};

exports.getDeploymentCount = async () => {
  return await Deployment.count({
    distinct: true,
    include:
    {
      model: Lease,
      required: true
    }
  });
};

function blockHeightToDatetime(blockHeight) {
  const firstBlockDate = new Date("2021-03-08 15:00:00 UTC");
  let blockDate = new Date("2021-03-08 15:00:00 UTC");
  blockDate.setSeconds(
    firstBlockDate.getSeconds() + averageBlockTime * (blockHeight - 1)
  );

  return blockDate;
}

exports.getPricingAverage = async () => {
  const activeDeploymentResources = await DeploymentGroupResource.findAll({
    where: {
      "$deploymentGroup.deployment.state$": "active",
      "$deploymentGroup.deployment.lease.state$": "active",
      cpuUnits: '100',
      memoryQuantity: '536870912',  // 512Mi
      storageQuantity: '536870912', // 512Mi
      count: 1
    },
    include: {
      model: DeploymentGroup,
      include: {
        model: Deployment,
        include: {
          model: Lease,
          required: true
        }
      }
    }
  });

  if (activeDeploymentResources.length === 0) return 0;

  const priceSum = activeDeploymentResources.map(x => x.deploymentGroup.deployment.lease.price).reduce((a, b) => a + b);
  const average = priceSum / activeDeploymentResources.length;

  //console.log(data.map(x => x.price + " / " + x.deploymentGroup.deployment.lease.price));

  return average;
}