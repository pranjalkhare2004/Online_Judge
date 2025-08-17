module.exports = {
  async up(db, client) {
    // Create the testcases collection
    await db.createCollection('testcases');
    
    // Create indexes for TestCase collection
    await db.collection('testcases').createIndex({ problemId: 1 });
    await db.collection('testcases').createIndex({ problemId: 1, isPublic: 1 });
    await db.collection('testcases').createIndex({ problemId: 1, createdAt: 1 });
    
    console.log('✅ TestCase collection created with indexes');
    
    // Migrate existing test cases from problems collection to separate testcases collection
    const problems = await db.collection('problems').find({ testCases: { $exists: true, $ne: [] } }).toArray();
    
    let migratedCount = 0;
    for (const problem of problems) {
      if (problem.testCases && problem.testCases.length > 0) {
        // Convert embedded test cases to separate documents
        const testCasesToInsert = problem.testCases.map(tc => ({
          problemId: problem._id,
          input: tc.input || '',
          expectedOutput: tc.expectedOutput || '',
          isPublic: tc.isPublic || false,
          createdAt: new Date(),
          updatedAt: new Date()
        }));
        
        // Insert test cases
        const insertResult = await db.collection('testcases').insertMany(testCasesToInsert);
        
        // Update problem to reference test cases by their IDs
        await db.collection('problems').updateOne(
          { _id: problem._id },
          { 
            $set: { 
              testCases: insertResult.insertedIds ? Object.values(insertResult.insertedIds) : []
            }
          }
        );
        
        migratedCount += testCasesToInsert.length;
      }
    }
    
    console.log(`✅ Migrated ${migratedCount} test cases from ${problems.length} problems`);
  },

  async down(db, client) {
    // Get all problems with test case references
    const problems = await db.collection('problems').find({ testCases: { $exists: true, $ne: [] } }).toArray();
    
    // Restore embedded test cases in problems
    for (const problem of problems) {
      if (problem.testCases && problem.testCases.length > 0) {
        // Get test cases for this problem
        const testCases = await db.collection('testcases')
          .find({ _id: { $in: problem.testCases } })
          .toArray();
        
        // Convert back to embedded format
        const embeddedTestCases = testCases.map(tc => ({
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          isPublic: tc.isPublic
        }));
        
        // Update problem with embedded test cases
        await db.collection('problems').updateOne(
          { _id: problem._id },
          { $set: { testCases: embeddedTestCases } }
        );
      }
    }
    
    // Drop the testcases collection
    await db.dropCollection('testcases');
    
    console.log('✅ Rolled back test cases to embedded format and dropped testcases collection');
  }
};
