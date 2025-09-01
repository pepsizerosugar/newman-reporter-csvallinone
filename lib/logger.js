"use strict";

/**
 * Logger utility.
 * - Format: [INFO] msg / [ERROR] msg
 * @module logger
 */

/**
 * @param {string} msg
 */
function info(msg) {
  // info log
  process.stdout.write(`[INFO] ${String(msg)}\n`);
}

/**
 * @param {string|Error} msg
 */
function error(msg) {
  const s =
    msg instanceof Error
      ? `${msg.message}\n${msg.stack || ""}`
      : String(msg);
  process.stderr.write(`[ERROR] ${s}\n`);
}

module.exports = { info, error };
