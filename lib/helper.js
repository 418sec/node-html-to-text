const { TextBuilder } = require('./text-builder');

// eslint-disable-next-line import/no-unassigned-import
require('./typedefs');

/**
 * Wrap text (according to options) and shrink white spaces.
 *
 * @param   { string }  text               Input text.
 * @param   { Options } options            HtmlToText options.
 * @param   { number }  firstLineCharCount Number of characters preoccupied in the first line.
 * @returns { string }                     Text with new-lines inserted at wrap locations.
 */
function wordwrap (text, options, firstLineCharCount) {
  if (!text) { return ''; }

  const textBuilder = new TextBuilder(options, firstLineCharCount);

  // Checking any allowed whitespace after newline makes better behavior
  // without breaking existing tests.
  // {0,4} is almost free compared to *, and seems sufficient for practical use.
  // Ideally, just \s is needed here.
  const isLeadingWhitespace = /^[\r\n\t]{0,4}[^\S\r\n\t]/.test(text);
  const isTrailingWhitespace = /[^\S\r\n\t][\r\n\t]{0,4}$/.test(text);

  if (isLeadingWhitespace) { textBuilder.addWord(''); }

  if (options.preserveNewlines) {

    const wordOrNewlineRe = /\S+|\n/gm;
    let m;
    while ((m = wordOrNewlineRe.exec(text)) !== null) {
      if (m[0] === '\n') {
        textBuilder.startNewLine();
      } else {
        textBuilder.addWord(m[0]);
      }
    }

  } else {

    const wordRe = /\S+/g;
    let m;
    while ((m = wordRe.exec(text)) !== null) {
      textBuilder.addWord(m[0]);
    }

  }

  if (isTrailingWhitespace) { textBuilder.addWord(''); }

  return textBuilder.toString();
}

/**
 * Split given tag description into it's components.
 *
 * @param { string } tagString Tag description string ("tag.class#id" etc).
 * @returns { { classes: string[], element: string, ids: string[] } }
 */
function splitCssSearchTag (tagString) {
  function getParams (re, string) {
    const captures = [];
    let found;
    while ((found = re.exec(string)) !== null) {
      captures.push(found[1]);
    }
    return captures;
  }

  const elementRe = /(^\w*)/g;
  return {
    classes: getParams(/\.([\d\w-]*)/g, tagString),
    element: elementRe.exec(tagString)[1],
    ids: getParams(/#([\d\w-]*)/g, tagString)
  };
}

/**
 * Make a recursive function that will only run to a given depth
 * and switches to an alternative function at that depth. \
 * No limitation if `n` is `undefined` (Just wraps `f` in that case).
 *
 * @param   { number | undefined } n Allowed depth of recursion. `undefined` for no limitation.
 * @param   { Function }           f Function that accepts recursive callback as the first argument.
 * @param   { Function }           g Function to run instead, when maximum depth was reached.
 * @returns { Function }
 */
function limitedDepthRecursive (n, f, g) {
  if (n === undefined) {
    const f1 = function (...args) { return f(f1, ...args); };
    return f1;
  }
  if (n >= 0) {
    return function (...args) { return f(limitedDepthRecursive(n - 1, f, g), ...args); };
  }
  return g;
}

/**
 * Convert a number into alphabetic sequence representation (Sequence without zeroes).
 *
 * For example: `a, ..., z, aa, ..., zz, aaa, ...`.
 *
 * @param   { number } num              Number to convert. Must be >= 1.
 * @param   { string } [baseChar = 'a'] Character for 1 in the sequence.
 * @param   { number } [base = 26]      Number of characters in the sequence.
 * @returns { string }
 */
function numberToLetterSequence (num, baseChar = 'a', base = 26) {
  const digits = [];
  do {
    num -= 1;
    digits.push(num % base);
    // eslint-disable-next-line no-bitwise
    num = (num / base) >> 0; // quick `floor`
  } while (num > 0);
  const baseCode = baseChar.charCodeAt(0);
  return digits
    .reverse()
    .map(n => String.fromCharCode(baseCode + n))
    .join('');
}

const I = ['I', 'X', 'C', 'M'];
const V = ['V', 'L', 'D'];

/**
 * Convert a number to it's Roman representation. No large numbers extension.
 *
 * @param   { number } num Number to convert. `0 < num <= 3999`.
 * @returns { string }
 */
function numberToRoman (num) {
  return [...num + '']
    .map(n => +n)
    .reverse()
    .map((v, i) => ((v % 5 < 4)
      ? (v < 5 ? '' : V[i]) + I[i].repeat(v % 5)
      : I[i] + (v < 5 ? V[i] : I[i + 1])))
    .reverse()
    .join('');
}

module.exports = {
  limitedDepthRecursive: limitedDepthRecursive,
  numberToLetterSequence: numberToLetterSequence,
  numberToRoman: numberToRoman,
  splitCssSearchTag: splitCssSearchTag,
  wordwrap: wordwrap
};
