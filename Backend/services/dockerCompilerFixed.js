/**
 * FIXED DOCKER-BASED CODE EXECUTION SERVICE
 * 
 * Secure, isolated code execution using Docker containers with dockerode library.
 * Supports multiple programming languages with resource limits.
 * Implements proper security measures and timeout handling.
 */

const Docker = require('dockerode');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const tar = require('tar-fs');
const stream = require('stream');

// Initialize Docker client
let docker;
try {
  // Handle different platforms
  if (process.platform === 'win32') {
    // Windows with Docker Desktop
    docker = new Docker();
  } else {
    // Linux/macOS
    docker = new Docker({ socketPath: '/var/run/docker.sock' });
  }
} catch (error) {
  console.warn('Docker not available, falling back to local execution:', error.message);
}

/**
 * Decode HTML entities in code to prevent compilation errors
 */
function decodeHtmlEntities(code) {
  const entityMap = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#x27;': "'",
    '&#x2F;': '/',
    '&#x60;': '`',
    '&#x3D;': '=',
    '&nbsp;': ' ',
    '&#x5C;': '\\',
    '&#x7B;': '{',
    '&#x7D;': '}',
    '&#x5B;': '[',
    '&#x5D;': ']',
    '&#x28;': '(',
    '&#x29;': ')',
    '&#x2B;': '+',
    '&#x2D;': '-',
    '&#x2A;': '*',
    '&#x25;': '%',
    '&#x21;': '!',
    '&#x3F;': '?',
    '&#x3A;': ':',
    '&#x3B;': ';',
    '&#x2C;': ',',
    '&#x2E;': '.',
    '&#x7C;': '|',
    '&#x5E;': '^',
    '&#x7E;': '~'
  };
  
  let decodedCode = code;
  for (const [entity, char] of Object.entries(entityMap)) {
    const regex = new RegExp(entity, 'g');
    decodedCode = decodedCode.replace(regex, char);
  }
  
  // Also handle numeric entities
  decodedCode = decodedCode.replace(/&#(\d+);/g, (match, num) => {
    return String.fromCharCode(parseInt(num, 10));
  });
  
  // Handle hex entities
  decodedCode = decodedCode.replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });
  
  return decodedCode;
}

// Docker image configurations for each language
const DOCKER_CONFIG = {
  cpp: {
    image: 'gcc:latest',
    compileCmd: ['g++', '-std=c++17', '-O2', '/app/solution.cpp', '-o', '/app/solution'],
    runCmd: ['/app/solution'],
    timeout: 10000,
    memoryLimit: 128 * 1024 * 1024, // 128MB
    cpuLimit: 0.5,
    fileName: 'solution.cpp'
  },
  java: {
    image: 'openjdk:11-jdk-slim',
    compileCmd: ['javac', '/app/Solution.java'],
    runCmd: ['java', '-cp', '/app', 'Solution'],
    timeout: 15000,
    memoryLimit: 256 * 1024 * 1024, // 256MB
    cpuLimit: 0.5,
    fileName: 'Solution.java'
  },
  python: {
    image: 'python:3.9-slim',
    compileCmd: null, // No compilation needed
    runCmd: ['python3', '/app/solution.py'],
    timeout: 10000,
    memoryLimit: 128 * 1024 * 1024, // 128MB
    cpuLimit: 0.5,
    fileName: 'solution.py'
  },
  javascript: {
    image: 'node:16-slim',
    compileCmd: null, // No compilation needed
    runCmd: ['node', '/app/solution.js'],
    timeout: 10000,
    memoryLimit: 128 * 1024 * 1024, // 128MB
    cpuLimit: 0.5,
    fileName: 'solution.js'
  }
};

// File extensions for each language
const FILE_EXTENSIONS = {
  cpp: 'cpp',
  java: 'java',
  python: 'py',
  javascript: 'js'
};

/**
 * Execute code in Docker container with security and resource limits
 */
async function executeCodeSecure(code, language, testCases) {
  const config = DOCKER_CONFIG[language];
  if (!config) {
    throw new Error(`Unsupported language: ${language}`);
  }

  if (!docker) {
    // Fallback to local execution if Docker not available
    const { executeCode } = require('./simpleCompiler');
    return await executeCode(code, language, testCases);
  }

  // ============= COMPREHENSIVE DEBUG LOGGING =============
  console.log('\n🔍 [DEBUG] ============= CODE EXECUTION ANALYSIS =============');
  console.log('🔍 [DEBUG] Language:', language);
  console.log('🔍 [DEBUG] Test cases count:', testCases.length);
  console.log('🔍 [DEBUG] Original code received:');
  console.log('📄 [DEBUG] Code length:', code.length);
  console.log('📄 [DEBUG] Code content:');
  console.log('```');
  console.log(code);
  console.log('```');
  
  // Check for problematic characters
  console.log('🔍 [DEBUG] Code analysis:');
  console.log('📄 [DEBUG] Has cin statements:', code.includes('cin'));
  console.log('📄 [DEBUG] Has >> operators:', code.includes('>>'));
  console.log('📄 [DEBUG] Has HTML entities:', /&[a-zA-Z0-9#]+;/.test(code));
  console.log('📄 [DEBUG] Character codes (first 100 chars):', 
    Array.from(code.substring(0, 100)).map(c => `${c}(${c.charCodeAt(0)})`).join(' '));

  // Decode HTML entities to prevent compilation errors
  const cleanCode = decodeHtmlEntities(code);
  console.log(`🧹 [DOCKER] HTML entities decoded for ${language}`);
  console.log(`📝 [DOCKER] Original code preview: ${code.substring(0, 100)}...`);
  console.log(`✨ [DOCKER] Cleaned code preview: ${cleanCode.substring(0, 100)}...`);
  
  // Additional debug for cleaned code
  console.log('🔍 [DEBUG] After HTML decoding:');
  console.log('📄 [DEBUG] Cleaned code length:', cleanCode.length);
  console.log('📄 [DEBUG] Cleaned code content:');
  console.log('```');
  console.log(cleanCode);
  console.log('```');
  console.log('📄 [DEBUG] Has cin after cleaning:', cleanCode.includes('cin'));
  console.log('📄 [DEBUG] Has >> after cleaning:', cleanCode.includes('>>'));
  
  // Test cases debug
  console.log('🔍 [DEBUG] Test cases details:');
  testCases.forEach((tc, index) => {
    console.log(`📋 [DEBUG] Test ${index + 1}: input='${tc.input}' expected='${tc.expectedOutput}'`);
  });
  console.log('🔍 [DEBUG] ======================================================\n');
  
  const sessionId = uuidv4();
  const tempDir = path.join(__dirname, '../temp', sessionId);
  
  try {
    // Create temporary directory
    await fs.mkdir(tempDir, { recursive: true });
    
    // Write cleaned code to file
    const codePath = path.join(tempDir, config.fileName);
    await fs.writeFile(codePath, cleanCode);

    // Pull Docker image if not exists
    await ensureDockerImage(config.image);

    const results = [];
    
    // Process each test case
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      const result = await runSingleTestCase(
        tempDir,
        config,
        testCase,
        sessionId,
        i
      );
      results.push(result);
    }

    // Calculate summary
    const passedTests = results.filter(r => r.passed).length;
    const totalExecutionTime = results.reduce((sum, r) => sum + r.executionTime, 0);
    const totalMemoryUsed = results.reduce((sum, r) => sum + r.memoryUsed, 0);

    return {
      success: true,
      results: results,
      summary: {
        totalTestCases: testCases.length,
        passedTestCases: passedTests,
        passed: passedTests === testCases.length,
        averageExecutionTime: Math.round(totalExecutionTime / testCases.length),
        averageMemoryUsed: Math.round(totalMemoryUsed / testCases.length)
      }
    };

  } catch (error) {
    console.error('Docker execution error:', error);
    return {
      success: false,
      error: 'Execution Error',
      details: error.message,
      results: []
    };
  } finally {
    // Cleanup temp directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }
  }
}

/**
 * Run a single test case in Docker container using dockerode
 */
async function runSingleTestCase(tempDir, config, testCase, sessionId, testIndex) {
  const containerName = `judge-${sessionId}-${testIndex}`;
  
  // ============= DETAILED TEST CASE DEBUG LOGGING =============
  console.log(`\n🧪 [TEST ${testIndex + 1}] ============= STARTING TEST CASE =============`);
  console.log(`🧪 [TEST ${testIndex + 1}] Container: ${containerName}`);
  console.log(`🧪 [TEST ${testIndex + 1}] Input: '${testCase.input}'`);
  console.log(`🧪 [TEST ${testIndex + 1}] Expected: '${testCase.expectedOutput}'`);
  console.log(`🧪 [TEST ${testIndex + 1}] Config:`, {
    image: config.image,
    fileName: config.fileName,
    memoryLimit: config.memoryLimit,
    timeout: config.timeout
  });
  
  try {
    const startTime = Date.now();
    
    // Build and log the execution command
    const executionCommand = await buildExecutionCommand(config, testCase);
    console.log(`🧪 [TEST ${testIndex + 1}] Execution command: ${executionCommand}`);
    
    // Check what files exist in temp directory
    const tempFiles = await fs.readdir(tempDir);
    console.log(`🧪 [TEST ${testIndex + 1}] Temp directory files:`, tempFiles);
    
    // Read and log the actual code file
    const codeFilePath = path.join(tempDir, config.fileName);
    const codeContent = await fs.readFile(codeFilePath, 'utf8');
    console.log(`🧪 [TEST ${testIndex + 1}] Code file content (${config.fileName}):`);
    console.log('```');
    console.log(codeContent);
    console.log('```');
    
    // Create container with security restrictions
    const container = await docker.createContainer({
      Image: config.image,
      name: containerName,
      WorkingDir: '/app',
      Cmd: ['bash', '-c', await buildExecutionCommand(config, testCase)],
      HostConfig: {
        Memory: config.memoryLimit,
        CpuShares: Math.floor(config.cpuLimit * 1024),
        NetworkMode: 'none', // No network access
        AutoRemove: true, // Auto cleanup
        ReadonlyRootfs: false // Allow writing for compilation
      },
      AttachStdout: true,
      AttachStderr: true,
      Tty: false
    });

    // Create tar stream from temp directory
    const tarStream = tar.pack(tempDir);

    // Copy files to container
    await container.putArchive(tarStream, { path: '/app' });

    // Start container
    await container.start();

    // Get logs
    const logStream = await container.logs({
      stdout: true,
      stderr: true,
      follow: true
    });

    // Collect output
    let stdout = '';
    let stderr = '';
    
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        container.kill().catch(() => {});
        reject(new Error('Time Limit Exceeded'));
      }, config.timeout);

      container.modem.demuxStream(
        logStream,
        process.stdout,
        process.stderr
      );

      // Capture output manually
      const chunks = [];
      logStream.on('data', (chunk) => {
        chunks.push(chunk);
      });

      logStream.on('end', () => {
        clearTimeout(timeout);
        
        // Parse demuxed output
        for (const chunk of chunks) {
          if (chunk.length > 8) {
            const streamType = chunk[0];
            const data = chunk.slice(8).toString();
            
            if (streamType === 1) { // stdout
              stdout += data;
            } else if (streamType === 2) { // stderr
              stderr += data;
            }
          }
        }
        
        resolve();
      });

      logStream.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });

    // Wait for container to finish
    const result = await container.wait();
    const executionTime = Date.now() - startTime;

    // ============= EXECUTION RESULT DEBUG LOGGING =============
    console.log(`🧪 [TEST ${testIndex + 1}] Container finished with status code: ${result.StatusCode}`);
    console.log(`🧪 [TEST ${testIndex + 1}] Execution time: ${executionTime}ms`);
    console.log(`🧪 [TEST ${testIndex + 1}] Raw stdout: '${stdout}'`);
    console.log(`🧪 [TEST ${testIndex + 1}] Raw stderr: '${stderr}'`);
    console.log(`🧪 [TEST ${testIndex + 1}] Stdout length: ${stdout.length}`);
    console.log(`🧪 [TEST ${testIndex + 1}] Stderr length: ${stderr.length}`);
    
    // Character analysis
    if (stdout.length > 0) {
      console.log(`🧪 [TEST ${testIndex + 1}] Stdout character codes:`, 
        Array.from(stdout.substring(0, 50)).map(c => `${c}(${c.charCodeAt(0)})`).join(' '));
    }

    // Get container stats (if available)
    let memoryUsed = 0;
    try {
      const stats = await container.stats({ stream: false });
      memoryUsed = Math.round((stats.memory_stats?.usage || 0) / 1024); // Convert to KB
      console.log(`🧪 [TEST ${testIndex + 1}] Memory used: ${memoryUsed}KB`);
    } catch (statsError) {
      // Stats might not be available, use default
      memoryUsed = 0;
      console.log(`🧪 [TEST ${testIndex + 1}] Memory stats not available:`, statsError.message);
    }

    // Clean up output
    const actualOutput = stdout.trim();
    const expectedOutput = testCase.expectedOutput.trim();
    const passed = actualOutput === expectedOutput;

    console.log(`🧪 [TEST ${testIndex + 1}] Actual output (trimmed): '${actualOutput}'`);
    console.log(`🧪 [TEST ${testIndex + 1}] Expected output (trimmed): '${expectedOutput}'`);
    console.log(`🧪 [TEST ${testIndex + 1}] Test passed: ${passed}`);
    console.log(`🧪 [TEST ${testIndex + 1}] ===============================================\n`);

    return {
      input: testCase.input,
      expectedOutput: testCase.expectedOutput,
      actualOutput: actualOutput,
      passed: passed,
      executionTime: executionTime,
      memoryUsed: memoryUsed,
      error: stderr.trim() || (result.StatusCode !== 0 ? `Process exited with code ${result.StatusCode}` : null)
    };

  } catch (error) {
    const executionTime = Date.now() - Date.now();
    return {
      input: testCase.input,
      expectedOutput: testCase.expectedOutput,
      actualOutput: '',
      passed: false,
      executionTime: config.timeout,
      memoryUsed: 0,
      error: error.message.includes('timeout') || error.message.includes('Time Limit') 
        ? 'Time Limit Exceeded' 
        : error.message
    };
  }
}

/**
 * Build execution command for the container
 */
async function buildExecutionCommand(config, testCase) {
  let command = '';
  
  // Compilation step if needed
  if (config.compileCmd) {
    command += config.compileCmd.join(' ') + ' && ';
  }
  
  // Execution step with input
  const escapedInput = testCase.input.replace(/'/g, "'\"'\"'");
  command += `echo '${escapedInput}' | ` + config.runCmd.join(' ');
  
  return command;
}

/**
 * Ensure Docker image exists, pull if necessary
 */
async function ensureDockerImage(imageName) {
  try {
    // Check if image exists
    try {
      await docker.getImage(imageName).inspect();
      return; // Image exists, no need to pull
    } catch (inspectError) {
      // Image doesn't exist, need to pull
    }

    console.log(`Pulling Docker image: ${imageName}`);
    
    return new Promise((resolve, reject) => {
      docker.pull(imageName, (err, stream) => {
        if (err) return reject(err);
        
        docker.modem.followProgress(stream, (err, output) => {
          if (err) return reject(err);
          console.log(`Docker image pulled: ${imageName}`);
          resolve();
        });
      });
    });
  } catch (error) {
    console.error(`Failed to ensure Docker image ${imageName}:`, error.message);
    throw error;
  }
}

/**
 * Check if Docker is available
 */
async function isDockerAvailable() {
  try {
    if (!docker) return false;
    await docker.ping();
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get supported languages
 */
function getSupportedLanguages() {
  return Object.keys(DOCKER_CONFIG).map(key => ({
    value: key,
    label: key.charAt(0).toUpperCase() + key.slice(1),
    extension: FILE_EXTENSIONS[key],
    dockerImage: DOCKER_CONFIG[key].image
  }));
}

module.exports = {
  executeCodeSecure,
  isDockerAvailable,
  getSupportedLanguages,
  DOCKER_CONFIG
};
