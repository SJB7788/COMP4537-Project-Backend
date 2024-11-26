const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRouter = require("./auth/authRouter");
const apiRouterV1 = require("./api/v1");
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const server = express();
server.use(cors({
  origin: 'https://comp4537-summaryproject.azurewebsites.net', 
  credentials: true, 
  methods: 'GET, PUT, POST, DELETE, OPTIONS',
  allowedHeaders: 'Content-Type, Authorization, Content-Length',
}));

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
server.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

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
