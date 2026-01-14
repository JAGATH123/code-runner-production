/**
 * Python Error Parser
 * Parses Python error messages to extract line numbers, error types, and friendly descriptions
 */

export interface ParsedPythonError {
  errorType: string;
  lineNumber: number | null;
  originalMessage: string;
  friendlyMessage: string;
  suggestion?: string;
}

/**
 * Parse Python error output and extract structured error information
 */
export function parsePythonError(stderr: string): ParsedPythonError | null {
  if (!stderr || stderr.trim() === '') {
    return null;
  }

  // Common Python error patterns
  // Note: Using [\s\S] instead of . with s flag for ES2015 compatibility
  const patterns = {
    // SyntaxError: invalid syntax (file.py, line 5)
    syntaxError: /File ".*?", line (\d+).*?\n\s*(.*?)\n\s*\^\s*\n(SyntaxError): ([\s\S]+?)(?:\n\n|\n(?=File)|$)/,

    // IndentationError: unexpected indent (file.py, line 3)
    indentationError: /File ".*?", line (\d+).*?\n\s*(.*?)\n\s*\^\s*\n(IndentationError): ([\s\S]+?)(?:\n\n|\n(?=File)|$)/,

    // NameError, TypeError, ValueError, etc. with traceback
    runtimeError: /File ".*?", line (\d+), in .+\n\s*(.*?)\n(\w+Error): ([\s\S]+?)(?:\n\n|\n(?=File)|$)/,

    // Generic error with line number
    genericWithLine: /File ".*?", line (\d+).*?\n(\w+Error): ([\s\S]+?)(?:\n\n|\n(?=File)|$)/,

    // Error without specific line (like import errors)
    genericNoLine: /(\w+Error): (.+)/,

    // Timeout error
    timeout: /Code execution timed out/i,

    // Container execution failed
    containerError: /Container execution failed/i,
  };

  // Check for timeout
  if (patterns.timeout.test(stderr)) {
    return {
      errorType: 'TimeoutError',
      lineNumber: null,
      originalMessage: stderr,
      friendlyMessage: 'Your code took too long to execute and was stopped.',
      suggestion: 'Check for infinite loops or operations that take too much time.'
    };
  }

  // Check for container error
  if (patterns.containerError.test(stderr)) {
    return {
      errorType: 'SystemError',
      lineNumber: null,
      originalMessage: stderr,
      friendlyMessage: 'A system error occurred while running your code.',
      suggestion: 'Please try again. If the problem persists, contact support.'
    };
  }

  // Check for SyntaxError
  const syntaxMatch = stderr.match(patterns.syntaxError);
  if (syntaxMatch) {
    const [, lineNum, codeLine, errorType, message] = syntaxMatch;
    return {
      errorType,
      lineNumber: parseInt(lineNum, 10),
      originalMessage: stderr,
      friendlyMessage: formatSyntaxError(message, codeLine),
      suggestion: getSyntaxErrorSuggestion(message)
    };
  }

  // Check for IndentationError
  const indentMatch = stderr.match(patterns.indentationError);
  if (indentMatch) {
    const [, lineNum, codeLine, errorType, message] = indentMatch;
    return {
      errorType,
      lineNumber: parseInt(lineNum, 10),
      originalMessage: stderr,
      friendlyMessage: formatIndentationError(message),
      suggestion: 'Make sure your code uses consistent indentation (spaces or tabs, not mixed).'
    };
  }

  // Check for runtime errors with traceback
  const runtimeMatch = stderr.match(patterns.runtimeError);
  if (runtimeMatch) {
    const [, lineNum, codeLine, errorType, message] = runtimeMatch;
    return {
      errorType,
      lineNumber: parseInt(lineNum, 10),
      originalMessage: stderr,
      friendlyMessage: formatRuntimeError(errorType, message),
      suggestion: getRuntimeErrorSuggestion(errorType, message)
    };
  }

  // Check for generic error with line number
  const genericLineMatch = stderr.match(patterns.genericWithLine);
  if (genericLineMatch) {
    const [, lineNum, errorType, message] = genericLineMatch;
    return {
      errorType,
      lineNumber: parseInt(lineNum, 10),
      originalMessage: stderr,
      friendlyMessage: `${errorType}: ${message}`,
      suggestion: getGenericSuggestion(errorType)
    };
  }

  // Check for generic error without line number
  const genericMatch = stderr.match(patterns.genericNoLine);
  if (genericMatch) {
    const [, errorType, message] = genericMatch;
    return {
      errorType,
      lineNumber: null,
      originalMessage: stderr,
      friendlyMessage: `${errorType}: ${message}`,
      suggestion: getGenericSuggestion(errorType)
    };
  }

  // If no pattern matched, return raw error
  return {
    errorType: 'Error',
    lineNumber: null,
    originalMessage: stderr,
    friendlyMessage: stderr,
  };
}

function formatSyntaxError(message: string, codeLine: string): string {
  if (message.includes('invalid syntax')) {
    return `Syntax error: Invalid Python syntax. Check for missing colons (:), parentheses, or quotes.`;
  }
  if (message.includes('EOL while scanning string')) {
    return `Syntax error: String is not closed properly. You're missing a closing quote.`;
  }
  if (message.includes('EOF while scanning')) {
    return `Syntax error: Unexpected end of code. You might be missing a closing bracket or parenthesis.`;
  }
  return `Syntax error: ${message}`;
}

function formatIndentationError(message: string): string {
  if (message.includes('unexpected indent')) {
    return `Indentation error: Unexpected indent found. Check your spacing at the beginning of the line.`;
  }
  if (message.includes('expected an indented block')) {
    return `Indentation error: Expected an indented block. Add spaces or a tab after the colon (:).`;
  }
  if (message.includes('unindent does not match')) {
    return `Indentation error: Inconsistent indentation. Make sure you use the same spacing throughout.`;
  }
  return `Indentation error: ${message}`;
}

function formatRuntimeError(errorType: string, message: string): string {
  switch (errorType) {
    case 'NameError':
      return `Name error: ${message}. You're trying to use a variable or function that doesn't exist or hasn't been defined yet.`;
    case 'TypeError':
      return `Type error: ${message}. You're using the wrong type of data for this operation.`;
    case 'ValueError':
      return `Value error: ${message}. The value you're using is not valid for this operation.`;
    case 'ZeroDivisionError':
      return `Division by zero: You can't divide by zero in mathematics or programming.`;
    case 'IndexError':
      return `Index error: ${message}. You're trying to access a position in a list that doesn't exist.`;
    case 'KeyError':
      return `Key error: ${message}. The key you're looking for doesn't exist in the dictionary.`;
    case 'AttributeError':
      return `Attribute error: ${message}. The object doesn't have this property or method.`;
    case 'ImportError':
    case 'ModuleNotFoundError':
      return `Import error: ${message}. The module or package you're trying to import isn't available.`;
    default:
      return `${errorType}: ${message}`;
  }
}

function getSyntaxErrorSuggestion(message: string): string {
  if (message.includes('invalid syntax')) {
    return 'Double-check your Python syntax. Common issues: missing colons after if/for/while/def, unclosed parentheses, or incorrect operators.';
  }
  if (message.includes('EOL while scanning string')) {
    return 'Add the missing closing quote (") or (\') at the end of your string.';
  }
  if (message.includes('EOF')) {
    return 'Check that all your brackets (), [], {} and quotes are properly closed.';
  }
  return 'Review your code for syntax errors according to Python rules.';
}

function getRuntimeErrorSuggestion(errorType: string, message: string): string {
  switch (errorType) {
    case 'NameError':
      if (message.includes('is not defined')) {
        const varMatch = message.match(/name '(\w+)' is not defined/);
        if (varMatch) {
          return `Define the variable or function '${varMatch[1]}' before using it, or check for typos in the name.`;
        }
      }
      return 'Make sure all variables and functions are defined before you use them.';

    case 'TypeError':
      if (message.includes('unsupported operand type')) {
        return 'Check that you\'re using compatible data types in your operation (e.g., don\'t try to add a string to a number).';
      }
      if (message.includes('not callable')) {
        return 'You\'re trying to call something that isn\'t a function. Remove the parentheses or use the correct function name.';
      }
      return 'Make sure you\'re using the correct data types for this operation.';

    case 'ValueError':
      if (message.includes('invalid literal')) {
        return 'The value cannot be converted to the requested type. For example, trying to convert "abc" to an integer.';
      }
      return 'Check that the value you\'re using is valid for this operation.';

    case 'ZeroDivisionError':
      return 'Avoid dividing by zero. Check your calculations or add a condition to prevent this.';

    case 'IndexError':
      return 'Make sure the index you\'re using is within the valid range of the list (0 to length-1).';

    case 'KeyError':
      return 'Check that the key exists in the dictionary before accessing it, or use .get() method instead.';

    case 'ImportError':
    case 'ModuleNotFoundError':
      return 'This module is not available in the current environment. Check the module name or use a different approach.';

    default:
      return 'Review the error message and check your code logic.';
  }
}

function getGenericSuggestion(errorType: string): string {
  const suggestions: Record<string, string> = {
    'SyntaxError': 'Check your Python syntax for missing colons, parentheses, or quotes.',
    'IndentationError': 'Use consistent indentation throughout your code (4 spaces is standard).',
    'NameError': 'Make sure all variables are defined before use.',
    'TypeError': 'Check that you\'re using compatible data types.',
    'ValueError': 'Verify that your values are valid for the operation.',
    'ImportError': 'The module you\'re trying to import is not available.',
    'AttributeError': 'The object doesn\'t have the attribute or method you\'re trying to access.',
  };

  return suggestions[errorType] || 'Review your code and the error message carefully.';
}

/**
 * Format parsed error for display
 */
export function formatErrorForDisplay(parsed: ParsedPythonError): string {
  let output = '';

  if (parsed.lineNumber !== null) {
    output += `Line ${parsed.lineNumber}: `;
  }

  output += `${parsed.errorType}\n\n`;
  output += `${parsed.friendlyMessage}`;

  if (parsed.suggestion) {
    output += `\n\nSuggestion: ${parsed.suggestion}`;
  }

  return output;
}
