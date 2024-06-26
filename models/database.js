const mongoose = require('mongoose');

// Define a schema for dynamic data points
const DynamicDataSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
    temperature: { type: Number, required: false },
    humidity: { type: Number, required: false },
    soilMoisture: { type: Number, required: false },
    powerState: { type: Boolean, required: false },
});

const DeviceSchema = new mongoose.Schema({
    deviceName: { type: String, required: true, unique: true },
    deviceCode: { type: String, required: false },
    deviceNumber: { type: Number, required: false },
    apiKey: { type: String, required: true },
    lastConnected: { type: Date, default: Date.now },
    location: { type: String, required: false },
    cropType: { type: String, required: false },
    dynamicData: [DynamicDataSchema], // Include the nested schema for dynamic data
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserData', required: true }, // Add userId field
}, { collection: 'user-device-data' });

const DeviceModel = mongoose.model('DeviceData', DeviceSchema);

module.exports = DeviceModel;
