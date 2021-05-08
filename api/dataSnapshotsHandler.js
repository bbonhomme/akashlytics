const dbProvider = require("./dbProvider");

exports.takeSnapshot = async (activeDeploymentCount, compute, memory, storage, allTimeDeploymentCount, totalAktSpent) => {
    const currentDate = getDay();

    const currentSnapshot = await dbProvider.getSnapshot(currentDate);

    let minActiveDeploymentCount = activeDeploymentCount;
    let maxActiveDeploymentCount = activeDeploymentCount;
    let minCompute = compute;
    let maxCompute = compute;
    let minMemory = memory;
    let maxMemory = memory;
    let minStorage = storage;
    let maxStorage = storage;

    if (currentSnapshot) {
        minActiveDeploymentCount = Math.min(currentSnapshot.minActiveDeploymentCount, activeDeploymentCount);
        maxActiveDeploymentCount = Math.max(currentSnapshot.maxActiveDeploymentCount, activeDeploymentCount);

        if (currentSnapshot.minCompute || currentSnapshot.minCompute === 0) {
            minCompute = Math.min(currentSnapshot.minCompute, compute);
            maxCompute = Math.max(currentSnapshot.maxCompute, compute);
        }
        if (currentSnapshot.minMemory || currentSnapshot.minMemory === 0) {
            minMemory = Math.min(currentSnapshot.minMemory, memory);
            maxMemory = Math.max(currentSnapshot.maxMemory, memory);
        }
        if (currentSnapshot.minStorage || currentSnapshot.minStorage === 0) {
            minStorage = Math.min(currentSnapshot.minStorage, storage);
            maxStorage = Math.max(currentSnapshot.maxStorage, storage);
        }
    }

    await dbProvider.updateDaySnapshot(currentDate, {
        minActiveDeploymentCount,
        maxActiveDeploymentCount,
        minCompute,
        maxCompute,
        minMemory,
        maxMemory,
        minStorage,
        maxStorage,
        allTimeDeploymentCount,
        totalAktSpent
    });
}

exports.getDayStr = () => {
    return getDay().toISOString().split('T')[0];
}

function getDay() {
    let currentDate = toUTC(new Date());
    currentDate.setUTCHours(0, 0, 0, 0);

    return currentDate;
}

function toUTC(date) {
    var now_utc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(),
        date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());

    return new Date(now_utc);
}