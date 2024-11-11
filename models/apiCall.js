const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ApiCallSchema = new Schema({
  api_call_id: { type: Schema.Types.ObjectId, default: new mongoose.Types.ObjectId(), unique: true },
  request_type: { type: String, required: true },
  request_string: { type: String, required: true }
});

module.exports = mongoose.model('ApiCall', ApiCallSchema);
