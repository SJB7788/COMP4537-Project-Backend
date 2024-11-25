const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserTypeSchema = new Schema({
    type: { type: Number, required: true, unique: true},
    description: { type: String, required: true }    
  });

module.exports = mongoose.model('UserType', UserTypeSchema);
