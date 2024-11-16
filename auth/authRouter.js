const express = require("express");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const crypto = require("crypto");

// mongodb modles
const User = require("../models/user");
const ApiToken = require("../models/apiToken");
const ApiCall = require("../models/apiCall");

dotenv.config({ path: require("path").resolve(__dirname, "../.env") });

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

const passwordManager = require("./bcrypt");

const router = express.Router();

router.post("/register", async (req, res) => {
  const body = req.body;

  const reqKeys = ["first_name", "last_name", "email", "password"];

  if (!body && !reqKeys.every((key) => key in body)) {
    res.status(400).json({ message: "Invalid JSON Body" });
    return;
  }
  const passwordManagerObj = new passwordManager.PasswordManager();

  const hashedPassword = await passwordManagerObj.hashPassword(body.password);

  // mongodb logic
  const { email, first_name, last_name } = body;
  try {
    // create token here
    const token = jwt.sign(
      { email, first_name, last_name, password: hashedPassword },
      process.env.JWT_SECRET_KEY
    );

    const newToken = new ApiToken({
      token: token,
    });

    const newUser = new User({
      email,
      first_name,
      last_name,
      password: hashedPassword,
      api_token_id: newToken._id,
    });

    await newUser.save();
    await newToken.save();

    res.status(200).json({ message: "User Successfully Created" });
  } catch (err) {
    console.error("Error registering user:", err);
    res.status(400).send("Error registering user.");
  }
});

router.post("/login", async (req, res) => {
  const body = req.body;
  console.log(body);
  
  const reqKeys = ["email", "password"];

  if (!body && !reqKeys.every((key) => key in body)) {
    res.status(400).json({ message: "Invalid JSON Body" });
    return;
  }

  // mongodb logic
  try {
    const { email, password } = body;

    const user = await User.findOne({ email });

    if (!user) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    const passwordManagerObj = new passwordManager.PasswordManager();

    if (await passwordManagerObj.comparePassword(password, user.password)) {
      const sessionToken = crypto.randomBytes(32).toString("hex");

      user.sessionToken = sessionToken;
      user.save();
      
      res.cookie("_sid", sessionToken, {
        httpOnly: true,
        sameSite: "None",
        secure: true,
      });
      
      res.status(200).json({ message: "Login Successful" });
      return;
    } else {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(400).send("Error logging in.");
  }
});

router.post("/logout", async (req, res) => {
  try {
    const session = req.cookies._sid;

    const sessionExists = await User.findOne({ sessionToken: session });

    if (!sessionExists) {
      return res
        .status(401)
        .json({ success: false, data: {}, error: "Session does not exist!" });
    }

    sessionExists.session = "";
    sessionExists.save();
    res.setHeader("Set-Cookie", `_sid=; Path=/; HttpOnly; SameSite=None; Secure;`);
    return res.status(200).json({ success: true, data: {}, error: null });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, data: {}, error: err.message });
  }
});

router.post("/checkSession", async (req, res) => {
  try {
    const sessionExists = await User.findOne({
      sessionToken: req.body.session,
    });
    console.log(sessionExists);

    if (!sessionExists) {
      return res
        .status(401)
        .json({ success: false, data: {}, error: "Session does not exist!" });
    }

    return res.status(200).json({ success: true, data: {}, error: null });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, data: {}, error: err.message });
  }
});

router.get("/apiCalls", async (req, res) => {
  try {
    const user = await User.findOne({ sessionToken: req.cookies._sid });
    if (!user) {
      return res
        .status(401)
        .json({ success: false, data: {}, error: "Session does not exist!" });
    }

    const apiTokenId = user.api_token_id;
    const apiToken = await ApiToken.findOne({ _id: apiTokenId });

    const apiCallsList = apiToken.api_list;
    if (apiCallsList.length === 0) {
      return res.status(200).json({ success: true, data: [], error: null });
    }

    const apiCallPromises = apiCallsList.map(async (apiCallId) => {
      return await ApiCall.findOne({ _id: apiCallId });
    });

    const apiCallObjectList = await Promise.all(apiCallPromises);

    return res
      .status(200)
      .json({ success: true, data: apiCallObjectList, error: null });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, data: {}, error: err.message });
  }
});

module.exports = router;
