/**
 * Expression engine for the Calculator (Architecture.md §6.3, CA-2).
 *
 * Tokenize → shunting-yard → evaluate, so operator precedence is correct
 * (`2 + 3 * 4` = 14, not 20). Supports scientific functions and constants.
 * Pure and dependency-free.
 */

type Token =
  | { kind: "num"; value: number }
  | { kind: "op"; value: string }
  | { kind: "func"; value: string }
  | { kind: "paren"; value: "(" | ")" };

const FUNCTIONS: Record<string, (x: number) => number> = {
  sin: (x) => Math.sin(x),
  cos: (x) => Math.cos(x),
  tan: (x) => Math.tan(x),
  ln: (x) => Math.log(x),
  log: (x) => Math.log10(x),
  sqrt: (x) => Math.sqrt(x),
  abs: (x) => Math.abs(x),
};

const CONSTANTS: Record<string, number> = {
  pi: Math.PI,
  e: Math.E,
};

const PRECEDENCE: Record<string, number> = {
  "+": 1,
  "-": 1,
  "*": 2,
  "/": 2,
  "%": 2,
  "^": 3,
};

const RIGHT_ASSOCIATIVE = new Set(["^"]);

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const src = input.replace(/\s+/g, "");

  while (i < src.length) {
    const ch = src[i];

    // Number (with optional decimal).
    if (/[0-9.]/.test(ch)) {
      let num = "";
      while (i < src.length && /[0-9.]/.test(src[i])) num += src[i++];
      tokens.push({ kind: "num", value: parseFloat(num) });
      continue;
    }

    // Identifier → function or constant.
    if (/[a-z]/i.test(ch)) {
      let name = "";
      while (i < src.length && /[a-z]/i.test(src[i])) name += src[i++];
      const lower = name.toLowerCase();
      if (lower in CONSTANTS) {
        tokens.push({ kind: "num", value: CONSTANTS[lower] });
      } else if (lower in FUNCTIONS) {
        tokens.push({ kind: "func", value: lower });
      } else {
        throw new Error(`Unknown name: ${name}`);
      }
      continue;
    }

    if (ch === "(" || ch === ")") {
      tokens.push({ kind: "paren", value: ch });
      i++;
      continue;
    }

    if (ch in PRECEDENCE) {
      // Unary minus: a '-' at the start or after an operator/'(' negates.
      if (ch === "-") {
        const prev = tokens[tokens.length - 1];
        const isUnary =
          !prev ||
          prev.kind === "op" ||
          (prev.kind === "paren" && prev.value === "(");
        if (isUnary) {
          tokens.push({ kind: "num", value: 0 });
        }
      }
      tokens.push({ kind: "op", value: ch });
      i++;
      continue;
    }

    throw new Error(`Unexpected character: ${ch}`);
  }

  return tokens;
}

/** Convert infix tokens to RPN via the shunting-yard algorithm. */
function toRpn(tokens: Token[]): Token[] {
  const output: Token[] = [];
  const stack: Token[] = [];

  for (const token of tokens) {
    switch (token.kind) {
      case "num":
        output.push(token);
        break;
      case "func":
        stack.push(token);
        break;
      case "op": {
        while (stack.length) {
          const top = stack[stack.length - 1];
          if (top.kind === "func") {
            output.push(stack.pop()!);
            continue;
          }
          if (
            top.kind === "op" &&
            (PRECEDENCE[top.value] > PRECEDENCE[token.value] ||
              (PRECEDENCE[top.value] === PRECEDENCE[token.value] &&
                !RIGHT_ASSOCIATIVE.has(token.value)))
          ) {
            output.push(stack.pop()!);
            continue;
          }
          break;
        }
        stack.push(token);
        break;
      }
      case "paren":
        if (token.value === "(") {
          stack.push(token);
        } else {
          while (stack.length && !(stack[stack.length - 1].kind === "paren")) {
            output.push(stack.pop()!);
          }
          if (!stack.length) throw new Error("Mismatched parentheses");
          stack.pop(); // discard "("
          if (stack[stack.length - 1]?.kind === "func") {
            output.push(stack.pop()!);
          }
        }
        break;
    }
  }

  while (stack.length) {
    const top = stack.pop()!;
    if (top.kind === "paren") throw new Error("Mismatched parentheses");
    output.push(top);
  }

  return output;
}

function evalRpn(rpn: Token[]): number {
  const stack: number[] = [];

  for (const token of rpn) {
    if (token.kind === "num") {
      stack.push(token.value);
    } else if (token.kind === "func") {
      const a = stack.pop();
      if (a === undefined) throw new Error("Invalid expression");
      stack.push(FUNCTIONS[token.value](a));
    } else if (token.kind === "op") {
      const b = stack.pop();
      const a = stack.pop();
      if (a === undefined || b === undefined) {
        throw new Error("Invalid expression");
      }
      switch (token.value) {
        case "+": stack.push(a + b); break;
        case "-": stack.push(a - b); break;
        case "*": stack.push(a * b); break;
        case "/": stack.push(a / b); break;
        case "%": stack.push(a % b); break;
        case "^": stack.push(Math.pow(a, b)); break;
        default: throw new Error(`Unknown operator: ${token.value}`);
      }
    }
  }

  if (stack.length !== 1) throw new Error("Invalid expression");
  return stack[0];
}

/** Evaluate an infix math expression. Throws on malformed input. */
export function evaluate(expression: string): number {
  if (!expression.trim()) return 0;
  const result = evalRpn(toRpn(tokenize(expression)));
  if (!Number.isFinite(result)) throw new Error("Math error");
  return result;
}
