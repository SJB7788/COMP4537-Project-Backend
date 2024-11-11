const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ApiTokenSchema = new Schema({
  token: { type: String, required: true, unique: true },
  api_list: [{ type: Schema.Types.ObjectId, ref: "ApiCall", default: [] }],
});

module.exports = mongoose.model("ApiToken", ApiTokenSchema);
