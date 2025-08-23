// Initialize MongoDB with required collections and indexes
db = db.getSiblingDB('onlinejudge');

// Create collections
db.createCollection('users');
db.createCollection('problems');
db.createCollection('submissions');
db.createCollection('testcases');
db.createCollection('contests');

// Create indexes for performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "username": 1 }, { unique: true });
db.problems.createIndex({ "slug": 1 }, { unique: true });
db.problems.createIndex({ "difficulty": 1 });
db.problems.createIndex({ "tags": 1 });
db.submissions.createIndex({ "userId": 1 });
db.submissions.createIndex({ "problemId": 1 });
db.submissions.createIndex({ "status": 1 });
db.submissions.createIndex({ "submittedAt": -1 });
db.testcases.createIndex({ "problemId": 1 });
db.contests.createIndex({ "startTime": 1 });
db.contests.createIndex({ "endTime": 1 });

print('MongoDB initialized successfully with collections and indexes');
