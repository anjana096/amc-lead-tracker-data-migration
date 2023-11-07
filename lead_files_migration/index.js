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
  Leads_lead_id: '"Leads_id"',
  directus_files_id: "directus_files_id",
};
const migrateData = async () => {
  const sourceClient = await sourcePool.connect();
  const targetClient = await targetPool.connect();

  try {
    console.log("Connected to both databases.");

    // Select data from the source database (AMC1)
    const selectQuery = 'SELECT * FROM "Leads_files"';
    const selectResult = await sourceClient.query(selectQuery);

    // Insert the selected data into the target database (LT1)
    for (const row of selectResult.rows) {
      const targetFields = [];
      const sourceFields = [];
      const values = [];

      for (const sourceField in customFieldMappings) {
        targetFields.push(customFieldMappings[sourceField]);
        sourceFields.push(sourceField);
        values.push(row[sourceField]);
      }

      const insertQuery = `
      INSERT INTO public."Leads_files" (${targetFields.join(", ")})
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
