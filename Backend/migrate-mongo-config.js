// migrate-mongo-config.js
require('dotenv').config();

const config = {
  mongodb: {
    // MongoDB connection URL with connection options
    url: process.env.MONGODB_URI || "mongodb://localhost:27017/onlinejudge",

    // Database name, by default the database name from the connection string is used
    databaseName: process.env.MONGODB_DATABASE || "onlinejudge",

    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  },

  // The migrations dir can be an absolute or relative path. Only edit this when really necessary.
  migrationsDir: "migrations",

  // The mongodb collection where the applied changes are stored. Only edit this when really necessary.
  changelogCollectionName: "changelog",

  // The file extension to create migrations and search for in migration dir 
  migrationFileExtension: ".js",

  // Enable the algorithm to create a checksum of the file contents and use that in the comparison to determin
  // if the file should be run.  Requires that scripts are coded to be run multiple times.
  useFileHash: false,

  // Don't change this, unless you know what you're doing
  moduleSystem: 'commonjs',
};

module.exports = config;
