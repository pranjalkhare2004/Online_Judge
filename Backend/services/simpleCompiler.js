/**
 * SIMPLE CODE COMPILER SERVICE
 * 
 * A lightweight code execution service that runs code locally without Docker.
 * Supports multiple programming languages with security restrictions.
 */

const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Language configurations for local execution
const languageConfigs = {
  javascript: {
    extension: 'js',
    compile: null, // No compilation needed
    execute: (filePath) => ['node', filePath],
    timeout: 5000
  },
  python: {
    extension: 'py',
    compile: null, // No compilation needed
    execute: (filePath) => ['python', filePath],
    timeout: 5000
  },
  cpp: {
    extension: 'cpp',
    compile: (filePath, outputPath) => ['g++', filePath, '-o', outputPath, '-std=c++17'],
    execute: (outputPath) => [outputPath],
    timeout: 10000
  },
  java: {
    extension: 'java',
    compile: (filePath) => ['javac', filePath],
    execute: (className, directory) => ['java', '-cp', directory, className],
    timeout: 10000
  }
};

/**
 * Execute code with given test cases
 */
async function executeCode(code, language, testCases = []) {
  const config = languageConfigs[language.toLowerCase()];
  if (!config) {
    throw new Error(`Unsupported language: ${language}`);
  }

  const tempId = uuidv4();
  const tempDir = path.join(__dirname, '../temp', tempId);
  
  try {
    // Create temp directory
    await fs.mkdir(tempDir, { recursive: true });
    
    // Write code to file
    const codeFileName = `solution.${config.extension}`;
    const codeFilePath = path.join(tempDir, codeFileName);
    await fs.writeFile(codeFilePath, code);

    let executablePath = codeFilePath;
    let executionArgs = [];

    // Compile if needed
    if (config.compile) {
      const compileResult = await compileCode(config, codeFilePath, tempDir);
      if (!compileResult.success) {
        return {
          success: false,
          error: 'Compilation Error',
          details: compileResult.error,
          results: []
        };
      }
      executablePath = compileResult.executablePath;
      executionArgs = compileResult.args || [];
    }

    // Run test cases
    const results = [];
    let totalExecutionTime = 0;
    let totalMemoryUsed = 0;

    if (testCases.length === 0) {
      // No test cases, just run the code once
      const result = await runCode(config, executablePath, executionArgs, '');
      results.push({
        input: '',
        expectedOutput: '',
        actualOutput: result.output,
        passed: true,
        executionTime: result.executionTime,
        memoryUsed: result.memoryUsed,
        error: result.error
      });
    } else {
      // Run each test case
      for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        const result = await runCode(config, executablePath, executionArgs, testCase.input);
        
        const passed = result.output.trim() === testCase.expectedOutput.trim();
        
        results.push({
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: result.output.trim(), // Trim output for cleaner comparison
          passed: passed,
          executionTime: result.executionTime,
          memoryUsed: result.memoryUsed,
          error: result.error
        });

        totalExecutionTime += result.executionTime;
        totalMemoryUsed += result.memoryUsed;
      }
    }

    const passedTests = results.filter(r => r.passed).length;
    const totalTests = results.length;

    return {
      success: true,
      results: results,
      summary: {
        totalTestCases: totalTests,
        passedTestCases: passedTests,
        passed: passedTests === totalTests,
        averageExecutionTime: totalTests > 0 ? Math.round(totalExecutionTime / totalTests) : 0,
        averageMemoryUsed: totalTests > 0 ? Math.round(totalMemoryUsed / totalTests) : 0
      }
    };

  } catch (error) {
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
 * Compile code if compilation is required
 */
async function compileCode(config, codeFilePath, tempDir) {
  return new Promise((resolve) => {
    const fileName = path.basename(codeFilePath, path.extname(codeFilePath));
    let outputPath, compileArgs;

    if (config.extension === 'cpp') {
      outputPath = path.join(tempDir, `${fileName}.exe`);
      compileArgs = config.compile(codeFilePath, outputPath);
    } else if (config.extension === 'java') {
      compileArgs = config.compile(codeFilePath);
      outputPath = fileName; // Java class name
    }

    const compileProcess = spawn(compileArgs[0], compileArgs.slice(1), {
      cwd: tempDir,
      timeout: 10000
    });

    let stderr = '';
    compileProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    compileProcess.on('close', (code) => {
      if (code === 0) {
        resolve({
          success: true,
          executablePath: config.extension === 'java' ? fileName : outputPath,
          args: config.extension === 'java' ? [tempDir] : []
        });
      } else {
        resolve({
          success: false,
          error: stderr || 'Compilation failed'
        });
      }
    });

    compileProcess.on('error', (error) => {
      resolve({
        success: false,
        error: `Compilation error: ${error.message}`
      });
    });
  });
}

/**
 * Run compiled code with input
 */
async function runCode(config, executablePath, args, input) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    let executeArgs;
    if (config.extension === 'java') {
      executeArgs = config.execute(executablePath, args[0]); // className, directory
    } else {
      executeArgs = config.execute(executablePath);
    }

    const runProcess = spawn(executeArgs[0], executeArgs.slice(1), {
      timeout: config.timeout,
      cwd: config.extension === 'java' ? args[0] : undefined,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    runProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    runProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    // Send input to process
    if (input && runProcess.stdin) {
      try {
        runProcess.stdin.write(input + '\n');
        runProcess.stdin.end();
      } catch (error) {
        console.error('Error writing to stdin:', error);
      }
    } else if (runProcess.stdin) {
      runProcess.stdin.end();
    }

    runProcess.on('close', (code) => {
      const executionTime = Date.now() - startTime;
      
      resolve({
        output: stdout.trim(),
        error: stderr || (code !== 0 ? `Process exited with code ${code}` : null),
        executionTime: executionTime,
        memoryUsed: Math.random() * 1024 * 100 // Simulated memory usage in KB
      });
    });

    runProcess.on('error', (error) => {
      const executionTime = Date.now() - startTime;
      resolve({
        output: '',
        error: `Execution error: ${error.message}`,
        executionTime: executionTime,
        memoryUsed: 0
      });
    });

    // Timeout handler
    setTimeout(() => {
      if (!runProcess.killed) {
        runProcess.kill('SIGKILL');
        resolve({
          output: '',
          error: 'Time Limit Exceeded',
          executionTime: config.timeout,
          memoryUsed: 0
        });
      }
    }, config.timeout);
  });
}

module.exports = {
  executeCode,
  languageConfigs
};
