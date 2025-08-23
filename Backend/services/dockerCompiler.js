/**
 * DOCKER-BASED CODE EXECUTION SERVICE
 * 
 * Secure, isolated code execution using Docker containers.
 * Supports multiple programming languages with resource limits.
 * Implements proper security measures and timeout handling.
 */

const { Docker } = require('node-docker-api');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const tar = require('tar-fs');

// Initialize Docker client
let docker;
try {
  // Handle different platforms
  if (process.platform === 'win32') {
    // Windows with Docker Desktop
    docker = new Docker({ socketPath: '//./pipe/docker_engine' });
  } else {
    // Linux/macOS
    docker = new Docker({ socketPath: '/var/run/docker.sock' });
  }
} catch (error) {
  console.warn('Docker not available, falling back to local execution:', error.message);
}

// Docker image configurations for each language
const DOCKER_CONFIG = {
  cpp: {
    image: 'gcc:latest',
    compileCmd: ['g++', '-std=c++17', '-O2', '/app/solution.cpp', '-o', '/app/solution'],
    runCmd: ['/app/solution'],
    timeout: 10000,
    memoryLimit: 128 * 1024 * 1024, // 128MB
    cpuLimit: 0.5
  },
  java: {
    image: 'openjdk:11-jdk-slim',
    compileCmd: ['javac', '/app/Solution.java'],
    runCmd: ['java', '-cp', '/app', 'Solution'],
    timeout: 15000,
    memoryLimit: 256 * 1024 * 1024, // 256MB
    cpuLimit: 0.5
  },
  python: {
    image: 'python:3.9-slim',
    compileCmd: null, // No compilation needed
    runCmd: ['python3', '/app/solution.py'],
    timeout: 10000,
    memoryLimit: 128 * 1024 * 1024, // 128MB
    cpuLimit: 0.5
  },
  javascript: {
    image: 'node:16-slim',
    compileCmd: null, // No compilation needed
    runCmd: ['node', '/app/solution.js'],
    timeout: 10000,
    memoryLimit: 128 * 1024 * 1024, // 128MB
    cpuLimit: 0.5
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

  const sessionId = uuidv4();
  const tempDir = path.join(__dirname, '../temp', sessionId);
  
  try {
    // Create temporary directory
    await fs.mkdir(tempDir, { recursive: true });
    
    // Write code to file
    const fileName = language === 'java' ? 'Solution.java' : `solution.${FILE_EXTENSIONS[language]}`;
    const codePath = path.join(tempDir, fileName);
    await fs.writeFile(codePath, code);

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
 * Run a single test case in Docker container
 */
async function runSingleTestCase(tempDir, config, testCase, sessionId, testIndex) {
  const containerName = `judge-${sessionId}-${testIndex}`;
  
  try {
    // Create container with security restrictions
    const container = await docker.container.create({
      Image: config.image,
      name: containerName,
      WorkingDir: '/app',
      Cmd: config.runCmd,
      HostConfig: {
        Memory: config.memoryLimit,
        CpuPeriod: 100000,
        CpuQuota: Math.floor(config.cpuLimit * 100000),
        NetworkMode: 'none', // No network access
        ReadonlyRootfs: false, // Allow writing to tmpfs mounts
        Tmpfs: {
          '/tmp': 'rw,noexec,nosuid,size=50m',
          '/app': 'rw,exec,nosuid,size=50m'
        },
        Ulimits: [
          { Name: 'fsize', Soft: 1024 * 1024, Hard: 1024 * 1024 }, // 1MB file size limit
          { Name: 'nproc', Soft: 10, Hard: 10 } // Process limit
        ],
        AutoRemove: true
      },
      AttachStdout: true,
      AttachStderr: true,
      AttachStdin: true,
      OpenStdin: true,
      StdinOnce: true
    });

    // Copy code files to container
    const tarStream = tar.pack(tempDir);
    await container.fs.put(tarStream, { path: '/app' });

    // Compilation step if needed
    if (config.compileCmd) {
      const compileResult = await runCompilation(container, config);
      if (!compileResult.success) {
        return {
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: '',
          passed: false,
          executionTime: 0,
          memoryUsed: 0,
          error: `Compilation Error: ${compileResult.error}`
        };
      }
    }

    // Start container
    const startTime = Date.now();
    await container.start();

    // Send input to container
    const stream = await container.attach({
      stream: true,
      stdin: true,
      stdout: true,
      stderr: true
    });

    // Write input
    if (testCase.input) {
      stream.write(testCase.input + '\n');
    }
    stream.end();

    // Set timeout
    const timeout = setTimeout(async () => {
      try {
        await container.kill();
      } catch (error) {
        // Container might already be stopped
      }
    }, config.timeout);

    // Wait for container to finish
    let stdout = '';
    let stderr = '';
    
    stream.on('data', (chunk) => {
      const data = chunk.toString();
      if (chunk[0] === 1) { // stdout
        stdout += data.slice(8);
      } else if (chunk[0] === 2) { // stderr
        stderr += data.slice(8);
      }
    });

    await new Promise((resolve) => {
      stream.on('end', resolve);
    });

    const result = await container.wait();
    const executionTime = Date.now() - startTime;
    
    clearTimeout(timeout);

    // Get container stats for memory usage
    const stats = await container.stats({ stream: false });
    const memoryUsed = stats.memory_stats?.usage || 0;

    // Clean up output
    const actualOutput = stdout.trim();
    const expectedOutput = testCase.expectedOutput.trim();
    const passed = actualOutput === expectedOutput;

    return {
      input: testCase.input,
      expectedOutput: testCase.expectedOutput,
      actualOutput: actualOutput,
      passed: passed,
      executionTime: executionTime,
      memoryUsed: Math.round(memoryUsed / 1024), // Convert to KB
      error: stderr.trim() || (result.StatusCode !== 0 ? `Process exited with code ${result.StatusCode}` : null)
    };

  } catch (error) {
    return {
      input: testCase.input,
      expectedOutput: testCase.expectedOutput,
      actualOutput: '',
      passed: false,
      executionTime: config.timeout,
      memoryUsed: 0,
      error: error.message.includes('timeout') ? 'Time Limit Exceeded' : error.message
    };
  }
}

/**
 * Run compilation in container if needed
 */
async function runCompilation(container, config) {
  if (!config.compileCmd) {
    return { success: true };
  }

  try {
    const exec = await container.exec({
      Cmd: config.compileCmd,
      AttachStdout: true,
      AttachStderr: true
    });

    const stream = await exec.start();
    let stderr = '';
    
    stream.on('data', (chunk) => {
      if (chunk[0] === 2) { // stderr
        stderr += chunk.toString().slice(8);
      }
    });

    await new Promise((resolve) => {
      stream.on('end', resolve);
    });

    const result = await exec.inspect();
    
    if (result.ExitCode !== 0) {
      return { success: false, error: stderr.trim() || 'Compilation failed' };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Ensure Docker image exists, pull if necessary
 */
async function ensureDockerImage(imageName) {
  try {
    const images = await docker.image.list();
    const imageExists = images.some(img => 
      img.RepoTags && img.RepoTags.some(tag => tag.startsWith(imageName))
    );

    if (!imageExists) {
      console.log(`Pulling Docker image: ${imageName}`);
      await docker.image.create({}, { fromImage: imageName });
      console.log(`Docker image pulled: ${imageName}`);
    }
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
