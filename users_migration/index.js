const { Pool } = require("pg");

// Create connection pools for both source (AMC1) and target (LT1) databases
const sourcePool = new Pool({
  user: "postgres",
  host: "0.0.0.0",
  database: "AMC1",
  password: "1234",
  port: 5432, //  AMC1 database
});

const targetPool = new Pool({
  user: "postgres",
  host: "0.0.0.0",
  database: "LT1",
  password: "1234",
  port: 5432, //  LT1 database
});

// field mappings from source to target
const customFieldMappings = {
  id: "id",
  first_name: "first_name",
  last_name: "last_name",
  email: "email",
  password: "password",
  location: "location",
  title: "title",
  description: "description",
  tags: "tags",
  avatar: "avatar",
  language: "language",
  tfa_secret: "tfa_secret",
  status: "status",
  token: "token",
  last_access: "last_access",
  last_page: "last_page",
  provider: "provider",
  external_identifier: "external_identifier",
  auth_data: "auth_data",
  email_notifications: "email_notifications",
  phone_number: "contact_number",
  date_created: "date_created",
  leave_mode: "leave_mode",
  arrival_date: "arrival_date",
  appearance: "appearance",
  theme_dark: "theme_dark",
  theme_light: "theme_light",
  theme_light_overrides: "theme_light_overrides",
  theme_dark_overrides: "theme_dark_overrides",
  organizations: "organizations",
};
const migrateData = async () => {
  const sourceClient = await sourcePool.connect();
  const targetClient = await targetPool.connect();

  try {
    console.log("Connected to both databases.");

    // Select data from the source database (AMC1)
    const selectQuery = "SELECT * FROM directus_users";
    const selectResult = await sourceClient.query(selectQuery);

    // Insert the selected data into the target database (LT1)
    for (const row of selectResult.rows) {
      const targetFields = [];
      const sourceFields = [];
      const values = [];

      for (const sourceField in customFieldMappings) {
        targetFields.push(customFieldMappings[sourceField]);
        sourceFields.push(sourceField);

        // Check if the source field is "organizations"
        if (sourceField === "organizations") {
          values.push(6); // Set the integer value 6
        } else {
          values.push(row[sourceField]);
        }
      }

      const insertQuery = `
      INSERT INTO directus_users (${targetFields.join(", ")})
      VALUES (${sourceFields.map((_, index) => "$" + (index + 1)).join(", ")})
    `;

      await targetClient.query(insertQuery, values);
    }

    console.log("Data migration completed.");
  } catch (error) {
    console.error("Error migrating data:", error);
  } finally {
    sourceClient.release();
    targetClient.release();
  }
};

migrateData();
