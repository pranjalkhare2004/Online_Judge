module.exports = {
  async up(db, client) {
    console.log('🔍 Adding enhanced indexes for performance optimization...');
    
    // Enhanced User indexes
    await db.collection('users').createIndex({ email: 1, username: 1 }, { name: 'email_username_compound' });
    await db.collection('users').createIndex({ isActive: 1, rating: -1 }, { name: 'active_rating_compound' });
    await db.collection('users').createIndex({ isVerified: 1, createdAt: -1 }, { name: 'verified_created_compound' });
    await db.collection('users').createIndex({ lastLogin: -1, isActive: 1 }, { name: 'lastlogin_active_compound' });
    
    console.log('✅ Enhanced User indexes created');
    
    // Enhanced Problem indexes
    await db.collection('problems').createIndex({ slug: 1, difficulty: 1, tags: 1 }, { name: 'slug_difficulty_tags_compound' });
    await db.collection('problems').createIndex({ isActive: 1, difficulty: 1 }, { name: 'active_difficulty_compound' });
    await db.collection('problems').createIndex({ isActive: 1, isFeatured: -1, createdAt: -1 }, { name: 'active_featured_created_compound' });
    await db.collection('problems').createIndex({ tags: 1, difficulty: 1, isActive: 1 }, { name: 'tags_difficulty_active_compound' });
    await db.collection('problems').createIndex({ createdBy: 1, isActive: 1 }, { name: 'createdby_active_compound' });
    
    // Text search index for problems
    await db.collection('problems').createIndex(
      { 
        title: 'text',
        description: 'text',
        tags: 'text'
      }, 
      { 
        name: 'problem_text_search',
        weights: {
          title: 10,
          tags: 5,
          description: 1
        }
      }
    );
    
    console.log('✅ Enhanced Problem indexes created');
    
    // Enhanced Submission indexes
    await db.collection('submissions').createIndex({ userId: 1, problemId: 1, submittedAt: -1 }, { name: 'user_problem_submitted_compound' });
    await db.collection('submissions').createIndex({ problemId: 1, status: 1, submittedAt: -1 }, { name: 'problem_status_submitted_compound' });
    await db.collection('submissions').createIndex({ userId: 1, status: 1, submittedAt: -1 }, { name: 'user_status_submitted_compound' });
    await db.collection('submissions').createIndex({ contestId: 1, userId: 1, submittedAt: -1 }, { name: 'contest_user_submitted_compound', sparse: true });
    await db.collection('submissions').createIndex({ language: 1, status: 1 }, { name: 'language_status_compound' });
    await db.collection('submissions').createIndex({ submittedAt: -1, status: 1 }, { name: 'submitted_status_compound' });
    await db.collection('submissions').createIndex({ contestId: 1, score: -1 }, { name: 'contest_score_compound', sparse: true });
    
    console.log('✅ Enhanced Submission indexes created');
    
    // Enhanced Contest indexes
    await db.collection('contests').createIndex({ startTime: 1, status: 1 }, { name: 'starttime_status_compound' });
    await db.collection('contests').createIndex({ isPublic: 1, startTime: -1 }, { name: 'public_starttime_compound' });
    await db.collection('contests').createIndex({ createdBy: 1, startTime: -1 }, { name: 'createdby_starttime_compound' });
    await db.collection('contests').createIndex({ endTime: 1, status: 1 }, { name: 'endtime_status_compound' });
    await db.collection('contests').createIndex({ status: 1, isPublic: 1, startTime: -1 }, { name: 'status_public_starttime_compound' });
    await db.collection('contests').createIndex({ maxParticipants: 1 }, { name: 'maxparticipants_sparse', sparse: true });
    
    // Text search index for contests
    await db.collection('contests').createIndex(
      { 
        title: 'text',
        description: 'text'
      }, 
      { 
        name: 'contest_text_search',
        weights: {
          title: 10,
          description: 1
        }
      }
    );
    
    console.log('✅ Enhanced Contest indexes created');
    
    console.log('🎉 All performance indexes have been successfully created!');
  },

  async down(db, client) {
    console.log('🗑️  Removing enhanced performance indexes...');
    
    // Remove User enhanced indexes
    const userIndexes = [
      'email_username_compound',
      'active_rating_compound', 
      'verified_created_compound',
      'lastlogin_active_compound'
    ];
    
    for (const indexName of userIndexes) {
      try {
        await db.collection('users').dropIndex(indexName);
      } catch (error) {
        console.log(`Index ${indexName} not found, skipping...`);
      }
    }
    
    // Remove Problem enhanced indexes
    const problemIndexes = [
      'slug_difficulty_tags_compound',
      'active_difficulty_compound',
      'active_featured_created_compound',
      'tags_difficulty_active_compound',
      'createdby_active_compound',
      'problem_text_search'
    ];
    
    for (const indexName of problemIndexes) {
      try {
        await db.collection('problems').dropIndex(indexName);
      } catch (error) {
        console.log(`Index ${indexName} not found, skipping...`);
      }
    }
    
    // Remove Submission enhanced indexes
    const submissionIndexes = [
      'user_problem_submitted_compound',
      'problem_status_submitted_compound',
      'user_status_submitted_compound',
      'contest_user_submitted_compound',
      'language_status_compound',
      'submitted_status_compound',
      'contest_score_compound'
    ];
    
    for (const indexName of submissionIndexes) {
      try {
        await db.collection('submissions').dropIndex(indexName);
      } catch (error) {
        console.log(`Index ${indexName} not found, skipping...`);
      }
    }
    
    // Remove Contest enhanced indexes
    const contestIndexes = [
      'starttime_status_compound',
      'public_starttime_compound',
      'createdby_starttime_compound',
      'endtime_status_compound',
      'status_public_starttime_compound',
      'maxparticipants_sparse',
      'contest_text_search'
    ];
    
    for (const indexName of contestIndexes) {
      try {
        await db.collection('contests').dropIndex(indexName);
      } catch (error) {
        console.log(`Index ${indexName} not found, skipping...`);
      }
    }
    
    console.log('✅ Enhanced indexes rollback completed');
  }
};
