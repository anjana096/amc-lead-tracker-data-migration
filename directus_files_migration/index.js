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
  storage: "storage",
  filename_disk: "filename_disk",
  filename_download: "filename_download",
  title: "title",
  type: "type",
  folder: "folder",
  uploaded_by: "uploaded_by",
  uploaded_on: "uploaded_on",
  charset: "charset",
  filesize: "filesize",
  width: "width",
  height: "height",
  duration: "duration",
  embed: "embed",
  description: "description",
  location: "location",
  tags: "tags",
  metadata: "metadata",
};
const migrateData = async () => {
  const sourceClient = await sourcePool.connect();
  const targetClient = await targetPool.connect();

  try {
    console.log("Connected to both databases.");

    // Select data from the source database (AMC1)
    const selectQuery = 'SELECT * FROM "directus_files"';
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
      INSERT INTO public."directus_files" (${targetFields.join(", ")})
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
