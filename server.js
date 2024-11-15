const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRouter = require("./auth/authRouter");
const apiRouterV1 = require("./api/v1");

const server = express();
server.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        "https://comp4537-summaryproject.azurewebsites.net",
        "http://localhost:8080",
      ];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

server.use(express.static("./"));
server.use(express.json());
server.use(cookieParser());
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: true }));

server.use("/auth", authRouter);
server.use("/api/v1", apiRouterV1);

server.get("/", (req, res) => {
  res.send("Hello World");
});

const PORT = process.env.PORT || 5500;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
