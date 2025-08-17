// Backend/utils/compiler.js
const dockerode = require('dockerode');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const docker = new dockerode();

// HTML entity decoder
const decodeHtmlEntities = (text) => {
  const entities = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#x27;': "'",
    '&#x2F;': '/',
    '&#x60;': '`',
    '&#x3D;': '='
  };
  
  return text.replace(/&[#\w]+;/g, (entity) => {
    return entities[entity] || entity;
  });
};

const languageConfig = {
  javascript: { image: 'node:18-alpine', ext: 'js', command: 'node code.js' },
  python: { image: 'python:3.9-alpine', ext: 'py', command: 'python code.py' },
  java: { image: 'openjdk:11-jre-slim', ext: 'java', command: 'javac Solution.java && java Solution' },
  cpp: { image: 'gcc:latest', ext: 'cpp', command: 'g++ code.cpp -o code && ./code' },
  go: { image: 'golang:1.19', ext: 'go', command: 'go run code.go' },
  c: { image: 'gcc:latest', ext: 'c', command: 'gcc code.c -o code && ./code' },
  rust: { image: 'rust:1.65', ext: 'rs', command: 'rustc code.rs && ./code' },
  kotlin: { image: 'kotlin:latest', ext: 'kt', command: 'kotlinc code.kt -include-runtime -d code.jar && java -jar code.jar' },
  swift: { image: 'swift:5.7-centos7', ext: 'swift', command: 'swift code.swift' },
  typescript: { image: 'node:18-alpine', ext: 'ts', command: 'npx ts-node code.ts' },
  php: { image: 'php:8.1', ext: 'php', command: 'php code.php' },
  ruby: { image: 'ruby:3.1', ext: 'rb', command: 'ruby code.rb' }
};

/**
 * Executes code in a Docker container with resource limits
 * @param {string} code - User-submitted code
 * @param {string} language - Programming language
 * @param {Object[]} testCases - Array of test cases with input and expectedOutput
 * @returns {Promise<Object[]>} Execution results
 */
const executeCode = async (code, language, testCases) => {
  const config = languageConfig[language];
  if (!config) throw new Error('Unsupported language');

  const results = [];

  try {
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      const sandboxId = uuidv4();
      const sandboxDir = path.join(process.cwd(), 'temp', sandboxId);
      await fs.mkdir(sandboxDir, { recursive: true });
      
      try {
        console.log(`[DEBUG] Processing test case ${i + 1}: ${testCase.input.substring(0, 50)}...`);
        
        // Decode HTML entities in the code
        const decodedCode = decodeHtmlEntities(code);
        console.log(`[DEBUG] Code decoded, length: ${decodedCode.length}`);
        
        const codeFile = path.join(sandboxDir, `code.${config.ext}`);
        const inputFile = path.join(sandboxDir, 'input.txt');
        
        await fs.writeFile(codeFile, decodedCode);
        await fs.writeFile(inputFile, testCase.input);
        
        console.log(`[DEBUG] Files written to: ${sandboxDir}`);

        // Convert Windows path to Docker volume format
        const dockerSandboxPath = sandboxDir.replace(/\\/g, '/').replace(/^([A-Za-z]):/, (match, drive) => `/${drive.toLowerCase()}`);
        console.log(`[DEBUG] Docker path: ${dockerSandboxPath}`);

        const container = await docker.createContainer({
          Image: config.image,
          Cmd: ['sh', '-c', `${config.command} < input.txt`],
          WorkingDir: '/workspace',
          HostConfig: {
            Memory: 256 * 1024 * 1024, // 256MB
            CpuPeriod: 100000,
            CpuQuota: 50000, // 0.5 CPU
            NetworkMode: 'none',
            Binds: [`${dockerSandboxPath}:/workspace`],
            AutoRemove: false // Manual removal for better control
          },
          WorkingDir: '/workspace'
        });

        console.log(`[DEBUG] Container created with command: ${config.command} < input.txt`);
        
        await container.start();
        console.log(`[DEBUG] Container started`);
        
        const timeout = setTimeout(() => container.kill(), 5000); // 5s timeout
        
        // Wait for container to finish first
        const result = await container.wait();
        console.log(`[DEBUG] Container finished with exit code: ${result.StatusCode}`);
        clearTimeout(timeout);
        
        // Get logs after container finishes
        const logs = await container.logs({
          stdout: true,
          stderr: true,
          follow: false,
          tail: 'all'
        });
        
        console.log(`[DEBUG] Container finished, logs length: ${logs.length}`);

      // Parse Docker multiplexed stream format properly
      let stdout = '';
      let stderr = '';
      
      if (logs.length > 0) {
        let offset = 0;
        while (offset < logs.length) {
          if (offset + 8 > logs.length) break;
          
          const streamType = logs[offset];
          const size = logs.readUInt32BE(offset + 4);
          const content = logs.toString('utf8', offset + 8, offset + 8 + size);
          
          if (streamType === 1) { // stdout
            stdout += content;
          } else if (streamType === 2) { // stderr
            stderr += content;
          }
          
          offset += 8 + size;
        }
      }
      
      stdout = stdout.trim();
      stderr = stderr.trim();
      
      console.log(`[DEBUG] Parsed stdout: "${stdout}"`);
      console.log(`[DEBUG] Parsed stderr: "${stderr}"`);
      
        
        const testResult = {
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: stdout,
          status: stdout.replace(/\s/g, '') === testCase.expectedOutput.replace(/\s/g, '') ? 'Passed' : 'Failed',
          executionTime: Math.random() * 1000, // Placeholder; replace with actual measurement
          memoryUsed: Math.random() * 100, // Placeholder; replace with actual measurement
          error: stderr
        };
        
        console.log(`[DEBUG] Test result: ${testResult.status} - Expected: "${testResult.expectedOutput}", Got: "${testResult.actualOutput}"`);
        
        results.push(testResult);

        // Add delay before container removal to avoid conflicts
        try {
          await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
          await container.remove({ force: true });
        } catch (removeError) {
          console.warn('Container removal warning:', removeError.message);
          // Don't throw error for cleanup issues
        }
        
      } catch (testError) {
        console.error(`Error in test case ${i + 1}:`, testError);
        results.push({
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: '',
          status: 'Failed',
          executionTime: 0,
          memoryUsed: 0,
          error: testError.message
        });
      } finally {
        // Clean up sandbox directory
        try {
          await fs.rm(sandboxDir, { recursive: true, force: true });
        } catch (cleanupError) {
          console.warn('Sandbox cleanup warning:', cleanupError.message);
        }
      }
    }
  } catch (error) {
    console.error('Execution error:', error);
    throw error;
  }

  return results;
};module.exports = { executeCode };
