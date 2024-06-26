const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    quote: { type: String }
}, { collection: 'user-profiles' });

const UserModel = mongoose.model('UserData', UserSchema);

module.exports = UserModel;
