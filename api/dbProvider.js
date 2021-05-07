const { Sequelize, DataTypes, Op, Deferrable, DATEONLY } = require("sequelize");
const { averageBlockTime } = require("./constants");
const baseSnapshots = require("./data/activeDeploymentCountSnapshots.json");

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
    escrowAccountTransferredAmount: { type: DataTypes.NUMBER, allowNull: false },
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

const ActiveDeploymentCountSnapshot = sequelize.define('activeDeploymentCountSnapshot', {
  date: { type: DataTypes.STRING, allowNull: false },
  min: { type: DataTypes.NUMBER, allowNull: false },
  max: { type: DataTypes.NUMBER, allowNull: false },
});

exports.clearDatabase = async () => {
  console.log("Cleaning database...");

  await Bid.drop();
  await Lease.drop();
  await DeploymentGroupResource.drop();
  await DeploymentGroup.drop();
  await Deployment.drop();

  await exports.init();
}

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
  await ActiveDeploymentCountSnapshot.sync();

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
    escrowAccountTransferredAmount: deployment.escrow_account.transferred.amount,
    datetime: blockHeightToDatetime(deployment.deployment.created_at)
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

  blockDate.setHours(0, 0, 0, 0);

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

  //console.log(activeDeploymentResources.map(x => x.price + " / " + x.deploymentGroup.deployment.lease.price));

  return average;
}

exports.getTotalAKTSpent = async () => {
  const total = await Deployment.sum("escrowAccountTransferredAmount");
  return total;
}

exports.getTotalResourcesLeased = async () => {
  const totalResources = await DeploymentGroupResource.findAll({
    attributes: [
      "count", "cpuUnits", "memoryQuantity", "storageQuantity"
    ],
    where: {
      "$deploymentGroup.deployment.state$": "active",
      "$deploymentGroup.deployment.lease.state$": "active"
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

  return {
    cpuSum: totalResources.map(x => x.cpuUnits * x.count).reduce((a, b) => a + b),
    memorySum: totalResources.map(x => x.memoryQuantity * x.count).reduce((a, b) => a + b),
    storageSum: totalResources.map(x => x.storageQuantity * x.count).reduce((a, b) => a + b)
  }
}

exports.updateDaySnapshot = async (date, dayMinActiveDeploymentCount, dayMaxActiveDeploymentCount) => {
  const dateStr = date.toISOString().split('T')[0];

  const existingSnapshot = await this.getSnapshot(date);
  
  if (existingSnapshot) {
    await ActiveDeploymentCountSnapshot.update({
      min: dayMinActiveDeploymentCount,
      max: dayMaxActiveDeploymentCount
    }, {
      where: {
        date: dateStr
      }
    });
  } else {
    await ActiveDeploymentCountSnapshot.create({
      date: dateStr,
      min: dayMinActiveDeploymentCount,
      max: dayMaxActiveDeploymentCount
    });
  }
}

exports.getSnapshot = async (date) => {
  const dateStr = date.toISOString().split('T')[0];

  return await ActiveDeploymentCountSnapshot.findOne({
    where: {
      date: dateStr
    }
  });
}

exports.getAllSnapshots = async () => {
  const results = await ActiveDeploymentCountSnapshot.findAll({
    attributes: ["date", "min", "max"],
    order: ["date"]
  });

  return results.map(x => x.toJSON()).map(x => ({...x, average: Math.round((x.min+x.max)/2)}));
};

exports.initSnapshotsFromFile = async () => {
  console.log("Loading " + baseSnapshots.length + " snapshots from file");
  await ActiveDeploymentCountSnapshot.bulkCreate(baseSnapshots);
};
