#!/usr/bin/env node
/**
 * Test Suite Entry Point
 * Run all tests in sequence
 */

// Core tests
import './core/trigger-detector.test.js';
import './core/role-recommender.test.js';
import './core/methodology-engine.test.js';

// Integration tests
import './integration/auto-trigger-flow.test.js';

console.log('🧪 PUAX Auto-Trigger Test Suite');
console.log('================================\n');
