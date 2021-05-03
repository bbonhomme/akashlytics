const dbProvider = require("./dbProvider");

exports.takeSnapshot = async (activeDeploymentCount) => {
    const currentDate = getDay();

    const currentSnapshot = await dbProvider.getSnapshot(currentDate);

    let min = activeDeploymentCount;
    let max = activeDeploymentCount;

    if (currentSnapshot) {
        min = Math.min(currentSnapshot.min, activeDeploymentCount);
        max = Math.max(currentSnapshot.max, activeDeploymentCount);
    }

    await dbProvider.updateDaySnapshot(currentDate, min, max);
}

function getDay() {
    let currentDate = toUTC(new Date());
    currentDate.setUTCHours(0, 0, 0, 0);

    return currentDate;
}

function toUTC(date){
    var now_utc =  Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(),
    date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());

    return new Date(now_utc);
}