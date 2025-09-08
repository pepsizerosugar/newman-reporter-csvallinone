"use strict";

/**
 * Common utility helpers.
 */

/**
 * Convert various inputs (Array | PropertyList {members} | toJSON()) to a plain array.
 * @param {*} list
 * @returns {Array}
 */
function listify(list) {
  if (!list) return []
  if (Array.isArray(list)) return list
  try {
    if (typeof list.toJSON === 'function') {
      const j = list.toJSON()
      if (Array.isArray(j)) return j
      if (j && Array.isArray(j.members)) return j.members
    }
    if (Array.isArray(list.members)) return list.members
  } catch (_) { /* noop */ }
  return []
}

/**
 * Escape single quotes for cURL
 * @param {string} s
 * @returns {string}
 */
function escapeSingleQuotes(s) {
  return String(s).replace(/'/g, "\\'")
}

/**
 * Check if value is empty.
 * @param {*} val
 * @returns {boolean}
 */
function isEmpty(val) {
  if (val === '' || val === null || val === undefined) return true
  if (typeof val === 'object') return Object.keys(val).length === 0
  return false
}

module.exports = { listify, escapeSingleQuotes, isEmpty }
