const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    email: { type: String, required: true, unique: true },
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    password: { type: String, required: true },
    api_token_id: { type: Schema.Types.ObjectId, ref: 'ApiToken' },
    sessionToken: {type: String, default: null},
    userType: {type: Number, default: 0, ref: 'UserType'}
  });

module.exports = mongoose.model('User', UserSchema);
