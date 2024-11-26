const express = require("express");
const dotenv = require("dotenv");
const { spawn } = require("child_process");
const jwt = require("jsonwebtoken");

const ApiToken = require("../models/apiToken");
const ApiCall = require("../models/apiCall");

dotenv.config({ path: require("path").resolve(__dirname, "../.env") });

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     TokenValidation:
 *       type: object
 *       required:
 *         - token
 *       properties:
 *         token:
 *           type: string
 *           description: The API token for authentication
 *       example:
 *         token: "your_api_token_here"
 *     SummarizeRequest:
 *       type: object
 *       required:
 *         - text
 *         - token
 *       properties:
 *         text:
 *           type: string
 *           description: The text to summarize
 *         token:
 *           type: string
 *           description: The API token for authentication
 *       example:
 *         text: "This is the text that needs to be summarized."
 *         token: "your_api_token_here"
 *     SummarizeResponse:
 *       type: object
 *       properties:
 *         summary:
 *           type: string
 *           description: The summarized text
 *       example:
 *         summary: "Summarized version of the input text."
 */

/**
 * @swagger
 * tags:
 *   name: Summarizer
 *   description: API for text summarization
 */

/**
 * @swagger
 * /summarize:
 *   post:
 *     summary: Summarize the given text
 *     tags: [Summarizer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SummarizeRequest'
 *     responses:
 *       200:
 *         description: Successfully summarized the text
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SummarizeResponse'
 *       400:
 *         description: Bad request or invalid token
 *       401:
 *         description: Unauthorized, invalid token
 *       500:
 *         description: Server error or failure in processing
 */

// Token validation middleware function
async function tokenValidationMiddleware(req, res, next) {
  console.log(req.body);
  
  const token = req.body.token;

  try {
    console.log(token);
    const tokenValid = await ApiToken.findOne({ token: token });
    
    if (!tokenValid) {
      res.status(400).json({ message: "Invalid Token" });
      return;
    }

    const apiCallAmount = tokenValid.api_list.length < 20;
    if (!apiCallAmount) {
      return res
        .status(400)
        .json({
          success: false,
          data: {},
          error: "You have reached the max API call amount",
        });
    }
  } catch (err) {
    res
      .status(400)
      .json({ message: "An error occured when validating the Token" });
    return;
  }

  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, _) => {
    if (err) {
      return res.status(401).json({ message: "Invalid Token" });
    }
    next();
  });
}

// Save API call history
async function saveAPICallHistory(token, requestType, requestString) {
  try {
    const apiCall = await ApiCall.create({
      request_type: requestType,
      request_string: requestString,
    });

    const apiToken = await ApiToken.findOne({ token: token });
    if (apiToken) {
      const apiArray = apiToken.api_list;
      apiArray.push(apiCall._id);

      apiToken.api_list = apiArray;

      await apiToken.save();
    } else {
      return false;
    }
    return true;
  } catch (err) {
    throw err;
  }
}

// Summarization endpoint
router.post("/summarize", tokenValidationMiddleware, (req, res) => {
  console.log("WORKING");
  
  // get the text from the request
  const text = req.body.text;

  // spawn the python script
  const pythonProcess = spawn("python3", ["summarize.py"]);

  // send the JSON input to the python process
  pythonProcess.stdin.write(JSON.stringify({ text }));
  // end the input stream
  pythonProcess.stdin.end();

  // variable to hold the output from the python script
  let data = "";

  // get the output from the python script and append to data
  pythonProcess.stdout.on("data", (chunk) => {
    data += chunk.toString();
  });

  // handle the end of the process
  pythonProcess.stdout.on("end", async () => {
    // try to send the response to client
    try {
      const result = JSON.parse(data);
      const apiCallHistory = await saveAPICallHistory(
        req.body.token,
        "POST",
        text
      );
      if (!apiCallHistory) {
        res
          .status(500)
          .json({ success: false, data: {}, error: "failed to save api call" });
        return;
      }
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to process the summary" });
    }
  });

  // handle errors
  pythonProcess.stderr.on("data", (error) => {
    console.error(`Error from Python script: ${error}`);
    res.status(500).json({ error: "An error occurred in Python processing" });
  });
});

module.exports = router;
