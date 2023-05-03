const { databaseService } = require("tc_dbcomm");
const mongoose = require("mongoose");
require("dotenv").config();

const db_address = process.env.DB_ADDRESS;
const db_user = process.env.DB_USER;
const db_password = process.env.DB_PASSWORD;
const database = `mongodb://${db_user}:${db_password}@${db_address}`; //database address
const connectionMap = {};

// connect to DB to fetch guild settings
const connectDB = async () => {
  const dbUri = database + "/" + process.env.RnDAO;
  await mongoose.set("strictQuery", false);
  // Connect to RnDAO DB
  await mongoose
    .connect(dbUri)
    .then(() => {
      console.log("Connected to MongoDB!");
    })
    .catch((e) => {
      Sentry.captureException(e)
      console.log(e);
    });
};

// create connection to specific guild collection with connection map
// if connection is already created, just return that connection
const createConnection = (guildId) => {
  try {
    if (connectionMap[guildId]) return connectionMap[guildId];
    const connection = databaseService.connectionFactory(guildId, database);
    connectionMap[guildId] = connection;
    return connection;
  } catch (e) {
    Sentry.captureException(e)
    console.log(e);
    return null;
  }
};

// remove connection
const removeConnection = (guildId) => {
  try {
    // can be connnecting, then should ignore
    if (connectionMap[guildId]) {
      connectionMap[guildId].close();
      connectionMap[guildId] = null;
    }
  } catch (e) {
    Sentry.captureException(e)
    return null;
  }
};

module.exports = {
  createConnection,
  removeConnection,
  connectDB,
};
