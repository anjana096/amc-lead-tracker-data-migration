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
  lead_id: "id",
  user_created: "user_created",
  date_created: "date_created",
  user_updated: "user_updated",
  date_updated: "date_updated",
  first_name: "first_name",
  last_name: "last_name",
  email: "email",
  occupation: "occupation",
  assigned_to: "assigned_to",
  NIC: '"NIC"',
  birth_day: "date_of_birth",
  visa_category: "visa_category",
  is_spouse_qualified: "spouse_qualified",
  qualified: "qualified",
  civil_status: "civil_status",
  age: "age",
  Consulted_by: "consult_by",
  consultation_method: "consult_method",
  other_visa_category: "other_visa_category",
  remarks: "remarks",
  spouse_details: "spouse_details",
  contact_number: "contact_number",
  contactable: "contactable",
  action_taken_for_contact: "action_taken_for_contact",
  educational_qualification: "educational_qualification",
  working_experience: "working_experience",
  client_type: "client_type",
  attending_status: "attending_status",
  Assigned_date: "assigned_date",
  campaign_name: "campaign_name",
  organizations: "organizations",
};
const migrateData = async () => {
  const sourceClient = await sourcePool.connect();
  const targetClient = await targetPool.connect();

  try {
    console.log("Connected to both databases.");

    // Select data from the source database (AMC1)
    const selectQuery = 'SELECT * FROM "Leads"';
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
      INSERT INTO public."Leads" (${targetFields.join(", ")})
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
