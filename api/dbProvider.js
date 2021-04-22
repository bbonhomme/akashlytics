const { Sequelize, DataTypes, Op } = require('sequelize');

const sequelize = new Sequelize('sqlite::memory:', {
    logging: false
});

const Lease = sequelize.define('Lease', {
    // Model attributes are defined here
    owner: { type: DataTypes.STRING, allowNull: false },
    dseq: { type: DataTypes.STRING, allowNull: false },
    state: { type: DataTypes.STRING, allowNull: false },

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
}

exports.addLease = async (lease) => {
    await Lease.create({
        owner: lease.lease.lease_id.owner,
        dseq: lease.lease.lease_id.dseq,
        state: lease.lease.state
    });
}

exports.getTotalLeaseCount = async () => {
    return await Lease.count();
}
exports.getActiveLeaseCount = async () => {
    return await Lease.count({
        where: {
            state: { [Op.eq]: "active" }
        }
    });
}