// Feature: swasthya-flow-opd-orchestrator, Property 7/8: Wait estimator logic
const fc = require('fast-check');
const assert = require('assert');
const { estimateWait } = require('../src/utils/predictor');

describe('Wait Estimator Properties', () => {
  it('Property 8: Wait estimator rolling average correctness', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }), 
        fc.array(fc.integer({ min: 1, max: 1800 }), { minLength: 1 }), 
        fc.integer({ min: 1, max: 10 }), 
        (position, durations, N) => {
          const expectedAvg = durations.slice(-N).reduce((a, b) => a + b, 0) / Math.min(durations.length, N);
          assert.strictEqual(estimateWait(position, durations, N), position * expectedAvg);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 9: Wait estimator empty-durations default', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        (position) => {
          assert.strictEqual(estimateWait(position, [], 5), position * 300);
        }
      ),
      { numRuns: 100 }
    );
  });
});
