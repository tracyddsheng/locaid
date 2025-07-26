const ZONES = {
    EATON_CANYON: { name: "Eaton Canyon", lat: { min: 34.17, max: 34.21 }, lon: { min: -118.12, max: -118.08 } },
    PASADENA: { name: "Pasadena", lat: { min: 34.13, max: 34.17 }, lon: { min: -118.18, max: -118.13 } },
    ALTADENA: { name: "Altadena", lat: { min: 34.18, max: 34.22 }, lon: { min: -118.16, max: -118.12 } },
    EAGLE_ROCK: { name: "Eagle Rock", lat: { min: 34.12, max: 34.15 }, lon: { min: -118.23, max: -118.19 } }
};

function generatePoints(count, type, zone) {
    const points = [];
    for (let i = 0; i < count; i++) {
        points.push({
            latitude: parseFloat((Math.random() * (zone.lat.max - zone.lat.min) + zone.lat.min).toFixed(6)),
            longitude: parseFloat((Math.random() * (zone.lon.max - zone.lon.min) + zone.lon.min).toFixed(6)),
            type: type,
            ...(type !== 'address' && { accuracy: Math.floor(Math.random() * 15) + 5 })
        });
    }
    return points;
}

const allPoints = { addresses: [], responders: [], users: [] };
const countsPerZone = { addresses: 25, responders: 5, users: 10 };

for (const zone of Object.values(ZONES)) {
    allPoints.addresses.push(...generatePoints(countsPerZone.addresses, 'address', zone));
    allPoints.responders.push(...generatePoints(countsPerZone.responders, 'responder', zone));
    allPoints.users.push(...generatePoints(countsPerZone.users, 'user', zone));
}

function assignDeviceIds(points, prefix) {
    return points.map((point, i) => ({
        ...point,
        deviceId: `${prefix}_${i}`
    }));
}

export const STATIC_ADDRESSES = assignDeviceIds(allPoints.addresses, 'address');
export const LIVE_TRACKERS_START = [
    ...assignDeviceIds(allPoints.responders, 'responder'),
    ...assignDeviceIds(allPoints.users, 'user')
]; 