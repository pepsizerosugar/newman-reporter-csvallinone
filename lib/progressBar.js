"use strict";

/**
 * Progress bar
 * Supported methods: start(total, initial), increment(step), stop()
 * Format placeholders: {bar}, {percentage}, {value}, {total}, {eta}
 */

const styles = require('./consoleStyles');
const readline = require('readline');

/**
 * @typedef {Object} BarOptions
 * @property {string} format
 * @property {string} barCompleteChar
 * @property {string} barIncompleteChar
 * @property {boolean} hideCursor
 * @property {boolean} noColor
 * @property {number} minUpdateMs
 */

class Bar {
  /**
   * @param {BarOptions} options
   */
  constructor(options = {}) {
    this.options = Object.assign({
      format: '[INFO] progress {bar} {percentage}% || Requests: {value}/{total} || ETA: {eta}s',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true,
      noColor: false,
      minUpdateMs: 80
    }, options);

    this.total = 0;
    this.value = 0;
    this.startTime = 0;
    this._lastDrawAt = 0; // last render timestamp
    this._lastRender = '';
  }

  /**
   * @param {number} total
   * @param {number} initial
   */
  start(total, initial = 0) {
    this.total = Math.max(0, Number(total) || 0);
    this.value = Math.max(0, Math.min(this.total, Number(initial) || 0));
    this.startTime = Date.now();
    if (this.options.hideCursor && process.stdout.isTTY) {
      process.stdout.write('\x1B[?25l'); // hide cursor
    }
    this._render();
  }

  /**
   * @param {number} step
   */
  increment(step = 1) {
    this.value = Math.max(0, Math.min(this.total, this.value + (Number(step) || 0)));
    this._render();
  }

  stop() {
    // Do not render again on final line
    if (this.options.hideCursor && process.stdout.isTTY) {
      process.stdout.write('\x1B[?25h'); // show cursor
    }
    process.stdout.write('\n');
  }

  _render(final = false) {
    // Render rate limiting
    const now = Date.now();
    if (!final && this._lastDrawAt && (now - this._lastDrawAt) < (this.options.minUpdateMs || 0)) {
      return;
    }

    const pct = (this.total > 0) ? this.value / this.total : 0;
    const done = Math.round(pct * 20);
    const bar = (this.options.noColor ? '' : styles.green)(
      this.options.barCompleteChar.repeat(done) +
      this.options.barIncompleteChar.repeat(20 - done)
    );

    const elapsed = (Date.now() - this.startTime) / 1000;
    const rate = elapsed > 0 ? this.value / elapsed : 0;
    const remain = rate > 0 ? (this.total - this.value) / rate : 0;

    let out = this.options.format
      .replace('{bar}', bar)
      .replace('{percentage}', String(Math.floor(pct * 100)))
      .replace('{value}', String(this.value))
      .replace('{total}', String(this.total))
      .replace('{eta}', String(Math.round(remain)));

    // Ensure we don't exceed terminal width
    const columns = process.stdout.columns || 80;
    if (out.length > columns) {
      out = out.substring(0, columns - 1) + '…';
    }

    // Clear the current line and write the progress
    if (process.stdout.isTTY) {
      try {
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0);
        process.stdout.write(out);
      } catch (_) {
        // Fallback for environments that don't support clearLine/cursorTo
        process.stdout.write(`\r${out}`);
      }
    } else {
      process.stdout.write(`\r${out}`);
    }

    // Only add newline on final render
    if (final) {
      process.stdout.write('\n');
    }

    this._lastRender = out;
    this._lastDrawAt = now;
  }
}

module.exports = { Bar };
