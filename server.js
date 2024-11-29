const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRouter = require("./auth/authRouter");
const apiRouterV1 = require("./api/v1");
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const server = express();
server.use(
  cors({
    origin: "http://localhost:8080",
    credentials: true,
    methods: "GET, PUT, POST, DELETE, OPTIONS",
    allowedHeaders: "Content-Type, Authorization, Content-Length, Accept, X-Requested-With, yourHeaderFeild",
    exposedHeaders: "Content-Length, Authorization",
  })
);

server.options("*", cors()); // Handle preflight requests

const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "API Documentation",
      version: "1.0.0",
      description: "API Information",
    },
    servers: [
      {
        url: "https://44.223.10.16.nip.io/api/v1/summarize",
      },
    ],
  },
  apis: ["api/v1.js"], // Path to your API routes
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
server.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

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

server.get("/test-cookie", (req, res) => {
  const cookieSettings = {
    path: "/",
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: true,
    sameSite: "None",
  }
  res.cookie("test", "fuc", cookieSettings);
  
  res.send("Cookie set");
});

server.get("/test-req-cookie", (req, res) => {
  console.log(req.cookies);
  res.send("Cookie read");
});

const PORT = process.env.PORT || 5500;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
