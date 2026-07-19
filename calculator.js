// Core calculator logic: a small tokenizer + recursive-descent parser that
// evaluates arithmetic expressions (+ - * / ^ and parentheses) without
// using eval(). Exposed as window.Calculator / module.exports so both the
// popup and the content script can share it.
//
// Grammar, loosest-binding first (mirrors the parse* function nesting):
//   expression := term (('+' | '-') term)*
//   term       := power (('*' | '/') power)*
//   power      := primary ('^' power)?      -- right-associative
//   primary    := number | '(' expression ')' | ('+' | '-') primary
(function (global) {
  // Splits a raw expression string into number and operator tokens.
  function tokenize(input) {
    const tokens = [];
    let index = 0;

    while (index < input.length) {
      const char = input[index];

      if (/\s/.test(char)) {
        index += 1;
        continue;
      }

      if (/\d/.test(char) || char === '.') {
        let start = index;
        let dotCount = 0;

        while (index < input.length) {
          const current = input[index];

          if (current === '.') {
            dotCount += 1;
            if (dotCount > 1) {
              throw new Error('Invalid number');
            }
            index += 1;
          } else if (/\d/.test(current)) {
            index += 1;
          } else {
            break;
          }
        }

        const value = Number(input.slice(start, index));
        if (!Number.isFinite(value)) {
          throw new Error('Invalid number');
        }

        tokens.push({ type: 'number', value });
        continue;
      }

      if ('+-*/^()'.includes(char)) {
        tokens.push({ type: 'operator', value: char });
        index += 1;
        continue;
      }

      throw new Error('Invalid character');
    }

    return tokens;
  }

  function createParser(tokens) {
    let index = 0;

    function peek() {
      return tokens[index] || null;
    }

    function consume(expected) {
      const current = peek();
      if (!current || current.value !== expected) {
        throw new Error('Unexpected token');
      }
      index += 1;
      return current;
    }

    function parsePrimary() {
      const current = peek();
      if (!current) {
        throw new Error('Unexpected end');
      }

      if (current.type === 'number') {
        index += 1;
        return current.value;
      }

      if (current.value === '(') {
        consume('(');
        const value = parseExpression();
        consume(')');
        return value;
      }

      if (current.value === '-' || current.value === '+') {
        const operator = consume(current.value).value;
        const value = parsePrimary();
        return operator === '-' ? -value : value;
      }

      throw new Error('Unexpected token');
    }

    function parsePower() {
      let value = parsePrimary();
      if (peek() && peek().value === '^') {
        consume('^');
        const exponent = parsePower();
        value = Math.pow(value, exponent);
      }
      return value;
    }

    function parseTerm() {
      let value = parsePower();

      while (peek() && (peek().value === '*' || peek().value === '/')) {
        const operator = consume(peek().value).value;
        const right = parsePower();
        value = operator === '*' ? value * right : value / right;
      }

      return value;
    }

    function parseExpression() {
      let value = parseTerm();

      while (peek() && (peek().value === '+' || peek().value === '-')) {
        const operator = consume(peek().value).value;
        const right = parseTerm();
        value = operator === '+' ? value + right : value - right;
      }

      return value;
    }

    return { parseExpression, index: () => index, tokens };
  }

  function evaluateExpression(input) {
    if (!input || !input.trim()) {
      return '0';
    }

    try {
      const tokens = tokenize(input);
      const parser = createParser(tokens);
      const result = parser.parseExpression();

      if (parser.index() !== tokens.length) {
        return 'Error';
      }

      return Number.isFinite(result) ? String(result) : 'Error';
    } catch (error) {
      return 'Error';
    }
  }

  const calculator = { evaluateExpression };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = calculator;
  }

  global.Calculator = calculator;
})(typeof window !== 'undefined' ? window : globalThis);
