require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const User = require("./models/user.js");
const DeviceModel = require("./models/database.js");

const app = express();
const port = 8080;

const mongoPass = process.env.mongoPass;
const secret = process.env.JWT_SECRET || 'defaultSecret123';

mongoose.connect(mongoPass, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(cors());
app.use(express.json());

// Middleware for user authentication
const authenticateUser = async (req, res, next) => {
  const token = req.headers['x-access-token'];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  try {
    const decoded = jwt.verify(token, secret);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

// Generate a unique API key
const generateApiKey = () => {
  return crypto.randomBytes(16).toString('hex');
};

// Routes
app.post('/register', async (req, res) => {
  try {
    const existingUser = await User.findOne({ email: req.body.email });

    if (existingUser) {
      return res.status(400).json({ status: 'error', error: 'Duplicate email' });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const newUser = new User({
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
    });

    await newUser.save();

    const token = jwt.sign(
      { userId: newUser._id, name: newUser.name, email: newUser.email },
      secret,
      { expiresIn: '1h' }
    );

    res.json({ status: 'ok', token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', error: 'Internal Server Error' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user || !await bcrypt.compare(req.body.password, user.password)) {
      return res.status(401).json({ status: 'error', error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, name: user.name, email: user.email },
      secret,
      { expiresIn: '1h' }
    );

   

    return res.json({ status: 'ok', user: token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: 'error', error: 'Internal Server Error' });
  }
});


// POST /newDevice endpoint
app.post('/newDevice', async (req, res, next) => {
  try {
    const { apiKey } = req.body;

    // Check if the device already exists
    const existingDevice = await DeviceModel.findOne({ apiKey });

    if (existingDevice) {
      // If the device exists, proceed without authentication
      existingDevice.dynamicData.push({
        timestamp: new Date(),
        temperature: req.body.temperature,
        humidity: req.body.humidity,
        soilMoisture: req.body.soilMoisture,
        powerState: req.body.powerState
      });
      await existingDevice.save();
      return res.json({ status: 'success', message: 'Data updated successfully' });
    }

    // If the device does not exist, use authentication middleware
    authenticateUser(req, res, next);
  } catch (error) {
    console.error(error.stack);
    res.status(500).json({ status: 'error', error: error.message });
  }
}, async (req, res) => {
  try {
    const { temperature, humidity, soilMoisture, powerState, deviceName, deviceCode, deviceNumber, location, cropType } = req.body;
    const userId = req.user._id; // Retrieve the userId from the authenticated user

    const newApiKey = generateApiKey();
    const newDevice = new DeviceModel({
      deviceName,
      deviceCode,
      deviceNumber,
      apiKey: newApiKey,
      location,
      cropType,
      dynamicData: [{
        timestamp: new Date(),
        temperature,
        humidity,
        soilMoisture,
        powerState
      }],
      userId // Set the userId from the authenticated user
    });

    await newDevice.save();
    res.json({ status: 'success', message: 'New device and data created successfully', apiKey: newApiKey });
  } catch (error) {
    console.error(error.stack);
    res.status(500).json({ status: 'error', error: error.message });
  }
});


app.get("/devices", authenticateUser, async (req, res) => {
  try {
    const devices = await DeviceModel.find({ userId: req.user._id });
    res.status(200).json(devices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /devices/:deviceName endpoint
app.get('/devices/:deviceName', async (req, res) => {
  try {
    const deviceName = req.params.deviceName;
    
    // Find the device based on deviceName
    const device = await DeviceModel.findOne({ deviceName });

    if (!device) {
      return res.status(404).json({ status: 'error', error: 'Device not found' });
    }

    // If device is found, return the device data
    res.json({ status: 'success', device });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', error: 'Internal Server Error' });
  }
});



app.delete("/devices/:id", authenticateUser, async (req, res) => {
  try {
    const id = req.params.id;
    const deleteDevice = await DeviceModel.findOneAndDelete({ _id: id, userId: req.user._id });
    if (!deleteDevice) {
      return res.status(404).json({ message: "Device not found" });
    }
    res.status(200).json({ message: "Device Deleted Successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server started on ${port}`);
});



To start the application type the follwoing commands:
1. npm install - updates all the application packages.
2. npm run dev - to start the application. 
