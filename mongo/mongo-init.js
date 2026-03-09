// Initialization script for the Wedge MongoDB database.
// This is executed automatically by the official MongoDB entrypoint
// when the data directory is empty.

// Use the "wedge" database (matches backend default in wedge.db.connect).
db = db.getSiblingDB("wedge");

// Create collections if they do not exist.
db.createCollection("projects");
db.createCollection("issues");
db.createCollection("users");

// ---------------------------------------------------------------------------
// Indexes for issues collection (based on Issue model and repository usage)
// ---------------------------------------------------------------------------

// Unique issue identifier like "WDG-1".
db.issues.createIndex({ identifier: 1 }, { unique: true });

// Common filter fields.
db.issues.createIndex({ state: 1 });
db.issues.createIndex({ project: 1 });
db.issues.createIndex({ assignee: 1 });

// ---------------------------------------------------------------------------
// Indexes for projects collection (based on Project model)
// ---------------------------------------------------------------------------

// Ensure project prefixes (e.g. "WDG") are unique.
db.projects.createIndex({ prefix: 1 }, { unique: true });

// ---------------------------------------------------------------------------
// Indexes for users collection (based on User model)
// ---------------------------------------------------------------------------

// Email should be unique per user.
db.users.createIndex({ email: 1 }, { unique: true });

// ---------------------------------------------------------------------------
// Seed default project, users and issues
// ---------------------------------------------------------------------------

// Only seed if the default project does not already exist.
var existingProject = db.projects.findOne({ prefix: "DFT" });
if (!existingProject) {
  var now = new Date();

  // Create a "default" project that matches the frontend's initial view.
  var projectInsert = db.projects.insertOne({
    name: "default",
    prefix: "DFT",
    description: "Default demo project",
    created_at: now,
    issue_counter: 2, // we will create two initial issues
  });

  var projectId = projectInsert.insertedId;
  var projectIdStr = projectId.toHexString(); // store as string
  print(`Inserted default project with ID: ${projectIdStr}`);

  // Dummy users
  db.users.insertMany([
    {
      displayname: "Alice Example",
      email: "alice@example.com",
      created_at: now,
    },
    {
      displayname: "Bob Example",
      email: "bob@example.com",
      created_at: now,
    },
  ]);

  // A couple of starter issues in the default project.
  db.issues.insertMany([
    {
      identifier: "DFT-1",
      title: "Set up Wedge project",
      state: "Todo",
      priority: "high",
      creator: "alice@example.com",
      project: projectIdStr,
      url: "/issue/DFT-1",
      created_at: now,
      updated_at: now,
      description: "Initial setup task for the default Wedge project.",
      assignee: "alice@example.com",
      labels: ["setup", "default"],
      comments: [],
      history: [],
    },
    {
      identifier: "DFT-2",
      title: "Create first demo issue",
      state: "In Progress",
      priority: "medium",
      creator: "bob@example.com",
      project: projectIdStr,
      url: "/issue/DFT-2",
      created_at: now,
      updated_at: now,
      description: "Example issue to demonstrate the board.",
      assignee: "bob@example.com",
      labels: ["demo"],
      comments: [],
      history: [],
    },
  ]);
}
