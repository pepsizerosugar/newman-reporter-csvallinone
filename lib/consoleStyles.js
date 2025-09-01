"use strict";

/**
 * Console color utility
 * - Supported: green
 * @module consoleStyles
 */

/**
 * @typedef {(s: string) => string} ColorFn
 */

const RESET = "\x1b[0m";
const GREEN = "\x1b[32m";

/** @type {{ green: ColorFn }} */
const styles = {
  /**
   * Wrap string with green color.
   * @param {string} s
   * @returns {string}
   */
  green(s) {
    return `${GREEN}${s}${RESET}`;
  }
};

module.exports = styles;
