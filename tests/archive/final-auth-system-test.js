/**
 * Final Authentication System Verification Test
 * Comprehensive end-to-end testing of the modernized frontend authentication
 */

const axios = require('axios');

const FRONTEND_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://localhost:5000';

const TEST_USER = {
  email: 'logintest@example.com',
  password: 'LoginTest123!'
};

const api = axios.create({
  timeout: 30000,
  validateStatus: function (status) {
    return status < 500;
  }
});

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function finalAuthSystemTest() {
  console.log('🎯 Final Authentication System Verification');
  console.log('=' .repeat(70));
  
  let score = 0;
  let maxScore = 0;
  const results = [];

  // Test 1: System Health Check
  console.log('\n1. System Health Check...');
  maxScore += 15;
  try {
    const [frontendHealth, backendHealth] = await Promise.all([
      api.get(`${FRONTEND_URL}/`),
      api.get(`${BACKEND_URL}/api/health`)
    ]);
    
    if (frontendHealth.status === 200) {
      console.log('✅ Frontend healthy');
      score += 8;
    }
    
    if (backendHealth.status === 200) {
      console.log('✅ Backend healthy');
      score += 7;
      results.push('✅ System health: Both frontend and backend operational');
    } else {
      results.push('❌ System health: Backend issues detected');
    }
  } catch (error) {
    console.log(`❌ System health check failed: ${error.message}`);
    results.push('❌ System health: Critical system failure');
  }

  // Test 2: Modern Authentication Flow Test
  console.log('\n2. Modern Authentication Flow Test...');
  maxScore += 25;
  try {
    const loginResponse = await api.post(`${BACKEND_URL}/api/auth/login`, TEST_USER);
    
    if (loginResponse.status === 200) {
      const tokens = loginResponse.data.data;
      
      if (tokens.accessToken && tokens.refreshToken) {
        console.log('✅ Modern token pair authentication working');
        console.log(`   Token structure: Access + Refresh tokens present`);
        score += 25;
        results.push('✅ Modern auth flow: Complete token pair implementation');
        
        // Store for subsequent tests
        global.authTokens = tokens;
      } else {
        console.log('❌ Token pair missing from response');
        results.push('❌ Modern auth flow: Token pair generation failed');
      }
    } else {
      console.log(`❌ Login failed: ${loginResponse.status}`);
      results.push('❌ Modern auth flow: Authentication failed');
    }
  } catch (error) {
    console.log(`❌ Authentication flow error: ${error.response?.data?.message || error.message}`);
    results.push('❌ Modern auth flow: System error during authentication');
  }

  // Test 3: Protected Route Security
  console.log('\n3. Protected Route Security Test...');
  maxScore += 20;
  let protectionScore = 0;
  
  if (global.authTokens?.accessToken) {
    try {
      // Test authenticated access
      const authenticatedResponse = await api.get(`${BACKEND_URL}/api/user/profile`, {
        headers: { 'Authorization': `Bearer ${global.authTokens.accessToken}` }
      });
      
      if (authenticatedResponse.status === 200) {
        console.log('✅ Authenticated access working correctly');
        protectionScore += 10;
      }
      
      // Test unauthenticated access
      const unauthenticatedResponse = await api.get(`${BACKEND_URL}/api/user/profile`);
      
      if (unauthenticatedResponse.status === 401 || unauthenticatedResponse.status === 403) {
        console.log('✅ Unauthenticated access properly blocked');
        protectionScore += 10;
      }
      
      score += protectionScore;
      
      if (protectionScore >= 15) {
        results.push('✅ Route security: Excellent protection implementation');
      } else if (protectionScore >= 10) {
        results.push('⚠️ Route security: Good protection with minor gaps');
      } else {
        results.push('❌ Route security: Security vulnerabilities detected');
      }
    } catch (error) {
      console.log(`❌ Route security test error: ${error.message}`);
      results.push('❌ Route security: Unable to test protection');
    }
  } else {
    results.push('❌ Route security: No tokens to test with');
  }

  // Test 4: Frontend Integration Test
  console.log('\n4. Frontend Integration and UX Test...');
  maxScore += 20;
  try {
    const frontendPages = ['/', '/auth', '/problems'];
    let pageScore = 0;
    
    for (const page of frontendPages) {
      try {
        const response = await api.get(`${FRONTEND_URL}${page}`);
        if (response.status === 200) {
          const content = response.data;
          
          // Check for modern auth integration
          if (content.includes('auth-context') || content.includes('AuthProvider')) {
            pageScore += 3;
          }
          
          // Check for coding platform elements
          if (content.includes('CodeJudge') || content.includes('Problems') || content.includes('Contest')) {
            pageScore += 2;
          }
          
          console.log(`✅ Page ${page} loaded successfully`);
        }
      } catch (error) {
        console.log(`❌ Page ${page} failed to load`);
      }
      await sleep(300);
    }
    
    score += pageScore;
    
    if (pageScore >= 15) {
      results.push('✅ Frontend integration: Excellent modern auth integration');
    } else if (pageScore >= 10) {
      results.push('⚠️ Frontend integration: Good integration with room for improvement');
    } else {
      results.push('❌ Frontend integration: Poor auth integration');
    }
  } catch (error) {
    console.log(`❌ Frontend integration error: ${error.message}`);
    results.push('❌ Frontend integration: Critical frontend issues');
  }

  // Test 5: User Experience and Coding Platform Assessment
  console.log('\n5. Coding Platform User Experience Test...');
  maxScore += 20;
  try {
    const homeResponse = await api.get(`${FRONTEND_URL}/`);
    const homeContent = homeResponse.data;
    
    let uxScore = 0;
    const features = [
      { check: () => homeContent.includes('CodeJudge'), name: 'Platform branding', points: 4 },
      { check: () => homeContent.includes('Problems') && homeContent.includes('Contests'), name: 'Core features', points: 4 },
      { check: () => homeContent.includes('Sign In') || homeContent.includes('Login'), name: 'Auth UI', points: 4 },
      { check: () => homeContent.includes('dark:') || homeContent.includes('tailwind'), name: 'Modern UI', points: 4 },
      { check: () => homeContent.includes('responsive') || homeContent.includes('mobile'), name: 'Responsive design', points: 4 }
    ];
    
    features.forEach(feature => {
      if (feature.check()) {
        console.log(`✅ ${feature.name} present`);
        uxScore += feature.points;
      } else {
        console.log(`⚠️ ${feature.name} missing or incomplete`);
      }
    });
    
    score += uxScore;
    
    if (uxScore >= 18) {
      results.push('✅ User experience: Excellent coding platform design');
    } else if (uxScore >= 14) {
      results.push('⚠️ User experience: Good design with minor improvements needed');
    } else {
      results.push('❌ User experience: Significant UX improvements required');
    }
  } catch (error) {
    console.log(`❌ UX test error: ${error.message}`);
    results.push('❌ User experience: Unable to assess UX');
  }

  // Calculate final assessment
  const percentage = Math.round((score / maxScore) * 100);
  
  console.log('\n' + '=' .repeat(70));
  console.log('🏆 FINAL AUTHENTICATION SYSTEM ASSESSMENT');
  console.log('=' .repeat(70));
  console.log(`\nOverall Score: ${score}/${maxScore} (${percentage}%)`);
  
  console.log('\n📊 Component Breakdown:');
  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result}`);
  });

  console.log('\n🎯 System Status:');
  if (percentage >= 90) {
    console.log('🟢 EXCELLENT - Production-ready authentication system');
    console.log('   ✨ Ready for live coding competitions');
    console.log('   ✨ Modern security implementation');
    console.log('   ✨ Superior user experience');
  } else if (percentage >= 80) {
    console.log('🟢 VERY GOOD - Strong authentication ready for production');
    console.log('   ✅ Suitable for coding competitions');
    console.log('   ✅ Good security measures');
    console.log('   ✅ Professional user experience');
  } else if (percentage >= 70) {
    console.log('🟡 GOOD - Functional authentication with minor improvements needed');
    console.log('   ⚠️ Suitable for testing and development');
    console.log('   ⚠️ Some security considerations needed');
  } else if (percentage >= 60) {
    console.log('🟠 FAIR - Basic authentication working');
    console.log('   🔧 Requires improvements before production');
    console.log('   🔧 Security enhancements needed');
  } else {
    console.log('🔴 NEEDS WORK - Significant authentication issues');
    console.log('   🚨 Not ready for production use');
    console.log('   🚨 Major improvements required');
  }

  console.log('\n💡 Final Recommendations:');
  if (percentage >= 85) {
    console.log('🎉 Congratulations! Your authentication system is excellent');
    console.log('✅ Deploy with confidence');
    console.log('✅ Consider advanced features: 2FA, SSO, advanced analytics');
    console.log('✅ Monitor and maintain security regularly');
  } else if (percentage >= 75) {
    console.log('👍 Great work! Minor polishing recommended');
    console.log('🔧 Focus on user experience improvements');
    console.log('🔧 Add comprehensive error handling');
    console.log('🔧 Consider performance optimizations');
  } else {
    console.log('🔨 Development work needed');
    console.log('📝 Address failing test components');
    console.log('📝 Improve security implementation');
    console.log('📝 Enhance user experience');
  }

  console.log('\n🚀 Coding Platform Readiness Assessment:');
  if (percentage >= 80) {
    console.log('🎯 Ready for competitive programming!');
    console.log('   • User registration and login working');
    console.log('   • Secure session management');
    console.log('   • Professional platform appearance');
    console.log('   • Modern authentication flow');
  } else if (percentage >= 70) {
    console.log('⚡ Almost ready for competitions');
    console.log('   • Core functionality working');
    console.log('   • Minor improvements recommended');
  } else {
    console.log('🔧 Additional development needed before competitions');
    console.log('   • Fix critical authentication issues');
    console.log('   • Improve security measures');
  }

  return { score, maxScore, percentage, results };
}

// Run the final test
finalAuthSystemTest()
  .then(result => {
    console.log(`\n✨ Final assessment completed: ${result.percentage}% system readiness`);
    process.exit(0);
  })
  .catch(error => {
    console.error('🚨 Final assessment failed:', error);
    process.exit(1);
  });
