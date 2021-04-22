const { Sequelize, DataTypes, Op } = require('sequelize');

const sequelize = new Sequelize('sqlite::memory:', {
    logging: false
});

const Lease = sequelize.define('Lease', {
    // Model attributes are defined here
    owner: { type: DataTypes.STRING, allowNull: false },
    dseq: { type: DataTypes.STRING, allowNull: false },
    state: { type: DataTypes.STRING, allowNull: false },
    datetime: { type: DataTypes.DATE, allowNull: false }
}, {
    // Other model options go here
});

const Deployment = sequelize.define('Deployment', {
    // Model attributes are defined here
    owner: { type: DataTypes.STRING, allowNull: false },
    dseq: { type: DataTypes.STRING, allowNull: false },
    state: { type: DataTypes.STRING, allowNull: false },
    datetime: { type: DataTypes.DATE, allowNull: false }
}, {
    // Other model options go here
});

exports.init = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }

    await Lease.sync({ force: true })
    await Deployment.sync({ force: true });
}

exports.addLease = async (lease) => {
    await Lease.create({
        owner: lease.lease.lease_id.owner,
        dseq: lease.lease.lease_id.dseq,
        state: lease.lease.state,
        datetime: blockHeightToDatetime(lease.lease.created_at)
    });
}

exports.addDeployment = async (deployment) => {
    await Deployment.create({
        owner: deployment.deployment.deployment_id.owner,
        dseq: deployment.deployment.deployment_id.dseq,
        state: deployment.deployment.state,
        datetime: blockHeightToDatetime(deployment.deployment.created_at)
    });
}

exports.getTotalLeaseCount = async () => {
    return await Lease.count();
}
exports.getActiveLeaseCount = async () => {
    return await Lease.count({
        where: {
            state: "active"
        }
    });
}

exports.getActiveDeploymentCount = async () => {
    return await Deployment.count({
        where: {
            state: "active"
        }
    });
}

function blockHeightToDatetime(blockHeight) {
    const averageBlockTime = 6.174;
    const firstBlockDate = new Date('2021-03-08 15:00:00 UTC');
    let blockDate = new Date('2021-03-08 15:00:00 UTC');
    blockDate.setSeconds(firstBlockDate.getSeconds() + averageBlockTime * (blockHeight - 1));

    return blockDate;
}