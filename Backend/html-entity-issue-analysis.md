# HTML Entity Issue - Analysis & Solution

## Problem Diagnosis ✅

Based on the logs you provided:
```
🧹 [DOCKER] HTML entities decoded for cpp
📝 [DOCKER] Original code preview: #include &lt;iostream&gt;
using namespace std;

int main() {
    int a, b;
    cin &gt;&gt; a &gt;&g...
✨ [DOCKER] Cleaned code preview: #include <iostream>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;
    cout << ...
29736
30712
```

## Root Cause Analysis

The issue is **NOT** with the HTML entity decoding - that's working perfectly (as evidenced by the cleaned code preview showing correct `<`, `>`, `>>` symbols).

The problem is that the code is producing **garbage values** (`29736`, `30712`) instead of the expected results (`8`, `0`). This indicates:

1. **Variables `a` and `b` are uninitialized** - they contain random memory values
2. **Input reading (`cin >> a >> b`) is failing** or being skipped
3. **Code structure might be corrupted** during transmission

## Possible Causes

### 1. Frontend Code Corruption
The frontend might be sending incomplete or corrupted code where:
- The `cin >> a >> b;` line is missing
- Line breaks are corrupted
- Code structure is malformed

### 2. HTML Entity Issues
Although decoding works for basic entities, there might be:
- **Double-encoded entities** (e.g., `&amp;lt;` instead of `&lt;`)
- **Unicode characters** that aren't handled
- **Zero-width characters** or invisible characters

### 3. Docker Input Issues
- Input redirection might be failing in Docker container
- Timing issues with input stream
- Container execution environment problems

## Immediate Solution

Add comprehensive logging to the Docker compiler to see exactly what code is being executed:

```javascript
// In dockerCompilerFixed.js, add this debug logging
console.log('🔍 [DEBUG] Original code received:');
console.log(JSON.stringify(code, null, 2));
console.log('🔍 [DEBUG] Code length:', code.length);
console.log('🔍 [DEBUG] Code bytes:', Array.from(code).map(c => c.charCodeAt(0)));

// After HTML decoding
console.log('🔍 [DEBUG] Decoded code:');
console.log(JSON.stringify(decodedCode, null, 2));
```

## Enhanced HTML Entity Decoding

Update the `decodeHtmlEntities` function to handle more edge cases:

```javascript
function decodeHtmlEntities(code) {
  // First pass: handle double-encoded entities
  let decodedCode = code;
  
  // Handle double-encoded entities (e.g., &amp;lt; -> &lt; -> <)
  decodedCode = decodedCode.replace(/&amp;/g, '&');
  
  // Standard entity map (existing code)
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
    '&#x7E;': '~',
    '&#x23;': '#',
    '&#x0A;': '\n',
    '&#x0D;': '\r',
    '&#x09;': '\t'
  };
  
  // Apply entity map multiple times to handle nested encoding
  for (let i = 0; i < 3; i++) {
    for (const [entity, char] of Object.entries(entityMap)) {
      const regex = new RegExp(entity, 'g');
      decodedCode = decodedCode.replace(regex, char);
    }
  }
  
  // Handle numeric entities
  decodedCode = decodedCode.replace(/&#(\d+);/g, (match, num) => {
    return String.fromCharCode(parseInt(num, 10));
  });
  
  // Handle hex entities
  decodedCode = decodedCode.replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });
  
  // Remove zero-width characters and other invisible characters
  decodedCode = decodedCode.replace(/[\u200B-\u200D\uFEFF]/g, '');
  
  return decodedCode;
}
```

## Testing Steps

1. **Add debug logging** to see exact code being executed
2. **Test with known problematic input** to reproduce the issue
3. **Check frontend code submission** to ensure correct code is being sent
4. **Verify input handling** in Docker container

## Expected Behavior

After fixes:
- ✅ Input `5 3` should output `8`
- ✅ Input `-1 1` should output `0`
- ✅ HTML entities fully decoded
- ✅ Code executes correctly in Docker

---
*Analysis completed on August 23, 2025*
