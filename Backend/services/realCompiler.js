/**
 * REAL CODE COMPILER SERVICE
 * 
 * Executes code in different languages with proper test case verification
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const { v4: uuidv4 } = require('uuid');

// HTML entity decoder
const decodeHTMLEntities = (text) => {
  const entities = {
    '&quot;': '"',
    '&#x27;': "'",
    '&#39;': "'",
    '&lt;': '<',
    '&gt;': '>',
    '&amp;': '&',
    '&#x2F;': '/',
    '&#47;': '/'
  };
  return text.replace(/&quot;|&#x27;|&#39;|&lt;|&gt;|&amp;|&#x2F;|&#47;/g, (match) => entities[match]);
};

// Create temp directory if it doesn't exist
const TEMP_DIR = path.join(__dirname, '../temp');

const ensureTempDir = async () => {
  try {
    await fs.access(TEMP_DIR);
  } catch {
    await fs.mkdir(TEMP_DIR, { recursive: true });
  }
};

// Language configurations
const LANGUAGE_CONFIGS = {
  javascript: {
    extension: 'js',
    compile: null,
    execute: (filename) => ['node', filename],
    timeout: 5000
  },
  python: {
    extension: 'py',
    compile: null,
    execute: (filename) => ['python', filename],
    timeout: 5000
  },
  cpp: {
    extension: 'cpp',
    compile: (filename, outputFile) => ['g++', '-o', outputFile, filename, '-std=c++17'],
    execute: (outputFile) => [process.platform === 'win32' ? path.basename(outputFile) : `./${path.basename(outputFile)}`],
    timeout: 10000
  },
  java: {
    extension: 'java',
    compile: (filename) => ['javac', filename],
    execute: (className) => ['java', className],
    timeout: 10000
  }
};

// Execute a command with timeout
const executeCommand = (command, args, options = {}) => {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, {
      cwd: options.cwd || TEMP_DIR,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    // Set timeout
    const timeout = setTimeout(() => {
      process.kill('SIGKILL');
      reject(new Error('Process timed out'));
    }, options.timeout || 5000);

    process.on('close', (code) => {
      clearTimeout(timeout);
      resolve({
        code,
        stdout: stdout.trim(),
        stderr: stderr.trim()
      });
    });

    process.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });

    // Send input if provided
    if (options.input) {
      process.stdin.write(options.input);
      process.stdin.end();
    }
  });
};

// Main execution function
const executeCode = async (code, language, testCases) => {
  await ensureTempDir();

  const config = LANGUAGE_CONFIGS[language];
  if (!config) {
    throw new Error(`Unsupported language: ${language}`);
  }

  const sessionId = uuidv4();
  const filename = `${sessionId}.${config.extension}`;
  const filepath = path.join(TEMP_DIR, filename);

  let results = [];
  let compilationError = null;

  try {
    // Decode HTML entities in code
    const cleanCode = decodeHTMLEntities(code);
    
    // Write code to file
    await fs.writeFile(filepath, cleanCode);

    let executablePath = filepath;
    let className = sessionId;

    // Extract class name for Java
    if (language === 'java') {
      const classMatch = cleanCode.match(/(?:^|\s)(?:public\s+)?class\s+(\w+)/);
      if (classMatch) {
        className = classMatch[1];
      }
    }

    // Compile if necessary
    if (config.compile) {
      if (language === 'cpp') {
        executablePath = path.join(TEMP_DIR, process.platform === 'win32' ? `${sessionId}.exe` : sessionId);
        const compileResult = await executeCommand(
          config.compile(filepath, executablePath)[0],
          config.compile(filepath, executablePath).slice(1),
          { timeout: config.timeout }
        );

        if (compileResult.code !== 0) {
          compilationError = compileResult.stderr || 'Compilation failed';
          throw new Error(compilationError);
        }
      } else if (language === 'java') {
        const compileResult = await executeCommand(
          config.compile(filepath)[0],
          config.compile(filepath).slice(1),
          { timeout: config.timeout }
        );

        if (compileResult.code !== 0) {
          compilationError = compileResult.stderr || 'Compilation failed';
          throw new Error(compilationError);
        }
      }
    }

    // Execute code for each test case
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      const startTime = Date.now();

      try {
        let executeCommand_args;
        if (language === 'cpp') {
          executeCommand_args = config.execute(executablePath);
        } else if (language === 'java') {
          executeCommand_args = config.execute(className);
        } else {
          executeCommand_args = config.execute(filepath);
        }

        const result = await executeCommand(
          executeCommand_args[0],
          executeCommand_args.slice(1),
          {
            input: testCase.input,
            timeout: config.timeout
          }
        );

        const executionTime = Date.now() - startTime;
        const actualOutput = result.stdout.trim();
        const expectedOutput = testCase.expectedOutput.trim();
        const passed = actualOutput === expectedOutput;

        results.push({
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: actualOutput,
          passed,
          status: passed ? 'PASSED' : 'FAILED',
          executionTime,
          memoryUsed: 0, // Would need system calls to get actual memory usage
          error: result.stderr ? result.stderr : null
        });

      } catch (error) {
        results.push({
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: '',
          passed: false,
          status: 'FAILED',
          executionTime: Date.now() - startTime,
          memoryUsed: 0,
          error: error.message
        });
      }
    }

  } catch (error) {
    if (!compilationError) {
      compilationError = error.message;
    }
  } finally {
    // Cleanup files
    try {
      await fs.unlink(filepath);
      if (language === 'cpp') {
        await fs.unlink(path.join(TEMP_DIR, process.platform === 'win32' ? `${sessionId}.exe` : sessionId));
      } else if (language === 'java') {
        await fs.unlink(path.join(TEMP_DIR, `${sessionId}.class`));
      }
    } catch (cleanupError) {
      console.warn('Cleanup error:', cleanupError.message);
    }
  }

  const totalTests = testCases.length;
  const passedTests = results.filter(r => r.passed).length;
  const totalExecutionTime = results.reduce((sum, r) => sum + r.executionTime, 0);
  const averageExecutionTime = totalTests > 0 ? totalExecutionTime / totalTests : 0;

  let overallResult = 'ACCEPTED';
  if (compilationError) {
    overallResult = 'COMPILATION_ERROR';
  } else if (passedTests === 0) {
    overallResult = 'WRONG_ANSWER';
  } else if (passedTests < totalTests) {
    overallResult = 'WRONG_ANSWER';
  } else if (results.some(r => r.error)) {
    overallResult = 'RUNTIME_ERROR';
  }

  return {
    results,
    totalTests,
    passedTests,
    executionTime: averageExecutionTime,
    memoryUsed: 0,
    overallResult,
    compilationError
  };
};

module.exports = { executeCode };
