/**
 * Unit tests for Failure Detector
 */

import {
  FailureDetector,
  BashFailureDetector,
  FailureEvent,
  globalFailureDetector
} from '../../../src/hooks/failure-detector.js';

describe('FailureDetector', () => {
  let detector: FailureDetector;

  beforeEach(() => {
    detector = new FailureDetector();
  });

  describe('Initial state', () => {
    it('should return pressure level 0 for new session', () => {
      expect(detector.getPressureLevel('new-session')).toBe(0);
    });

    it('should return 0 consecutive failures for new session', () => {
      expect(detector.getConsecutiveFailures('new-session')).toBe(0);
    });
  });

  describe('recordFailure', () => {
    it('should increment consecutive failures', () => {
      const event: FailureEvent = {
        toolName: 'bash',
        exitCode: 1,
        timestamp: Date.now(),
        sessionId: 'test-session'
      };

      detector.recordFailure(event);
      expect(detector.getConsecutiveFailures('test-session')).toBe(1);
    });

    it('should increment pressure level after multiple failures', () => {
      const event: FailureEvent = {
        toolName: 'bash',
        exitCode: 1,
        timestamp: Date.now(),
        sessionId: 'test-session'
      };

      detector.recordFailure(event);
      detector.recordFailure(event);
      detector.recordFailure(event);

      expect(detector.getPressureLevel('test-session')).toBeGreaterThanOrEqual(1);
    });

    it('should track tool-specific failures', () => {
      const bashEvent: FailureEvent = {
        toolName: 'bash',
        exitCode: 1,
        timestamp: Date.now(),
        sessionId: 'test-session'
      };

      const readEvent: FailureEvent = {
        toolName: 'read',
        exitCode: 1,
        timestamp: Date.now(),
        sessionId: 'test-session'
      };

      detector.recordFailure(bashEvent);
      detector.recordFailure(bashEvent);
      detector.recordFailure(readEvent);

      expect(detector.getToolFailures('test-session', 'bash')).toBe(2);
      expect(detector.getToolFailures('test-session', 'read')).toBe(1);
    });

    it('should escalate to L4 after 8+ consecutive failures', () => {
      const event: FailureEvent = {
        toolName: 'bash',
        exitCode: 1,
        timestamp: Date.now(),
        sessionId: 'test-session'
      };

      for (let i = 0; i < 8; i++) {
        detector.recordFailure(event);
      }

      expect(detector.getPressureLevel('test-session')).toBe(4);
    });
  });

  describe('recordSuccess', () => {
    it('should reset consecutive failures after success', () => {
      const event: FailureEvent = {
        toolName: 'bash',
        exitCode: 1,
        timestamp: Date.now(),
        sessionId: 'test-session'
      };

      detector.recordFailure(event);
      detector.recordFailure(event);
      detector.recordSuccess('test-session');

      expect(detector.getConsecutiveFailures('test-session')).toBe(0);
    });

    it('should not affect total failures', () => {
      const event: FailureEvent = {
        toolName: 'bash',
        exitCode: 1,
        timestamp: Date.now(),
        sessionId: 'test-session'
      };

      detector.recordFailure(event);
      detector.recordFailure(event);
      detector.recordSuccess('test-session');

      const state = detector.getState('test-session');
      expect(state.totalFailures).toBe(2);
    });
  });

  describe('reset', () => {
    it('should reset consecutive failures with level=consecutive', () => {
      const event: FailureEvent = {
        toolName: 'bash',
        exitCode: 1,
        timestamp: Date.now(),
        sessionId: 'test-session'
      };

      detector.recordFailure(event);
      detector.recordFailure(event);
      detector.reset('test-session', 'consecutive');

      expect(detector.getConsecutiveFailures('test-session')).toBe(0);
      expect(detector.getPressureLevel('test-session')).toBe(0);
    });

    it('should reset everything with level=all', () => {
      const event: FailureEvent = {
        toolName: 'bash',
        exitCode: 1,
        timestamp: Date.now(),
        sessionId: 'test-session'
      };

      detector.recordFailure(event);
      detector.recordFailure(event);
      detector.reset('test-session', 'all');

      const state = detector.getState('test-session');
      expect(state.totalFailures).toBe(0);
      expect(state.consecutiveFailures).toBe(0);
      expect(state.pressureLevel).toBe(0);
    });
  });

  describe('shouldEscalate', () => {
    it('should return true when pressure level increases from first failure', () => {
      const event: FailureEvent = {
        toolName: 'bash',
        exitCode: 1,
        timestamp: Date.now(),
        sessionId: 'test-session'
      };

      detector.recordFailure(event);
      expect(detector.shouldEscalate('test-session')).toBe(true);
    });

    it('should return false when pressure level does not increase', () => {
      const event: FailureEvent = {
        toolName: 'bash',
        exitCode: 1,
        timestamp: Date.now(),
        sessionId: 'test-session'
      };

      detector.recordFailure(event);
      detector.recordSuccess('test-session');
      expect(detector.shouldEscalate('test-session')).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all states', () => {
      const event: FailureEvent = {
        toolName: 'bash',
        exitCode: 1,
        timestamp: Date.now(),
        sessionId: 'test-session'
      };

      detector.recordFailure(event);
      detector.clear();

      expect(detector.getConsecutiveFailures('test-session')).toBe(0);
    });
  });

  describe('Event emission', () => {
    it('should emit failure event', (done) => {
      const event: FailureEvent = {
        toolName: 'bash',
        exitCode: 1,
        timestamp: Date.now(),
        sessionId: 'test-session'
      };

      detector.on('failure', ({ event: e, state }) => {
        expect(e.toolName).toBe('bash');
        expect(state.consecutiveFailures).toBe(1);
        done();
      });

      detector.recordFailure(event);
    });

    it('should emit success event', (done) => {
      const event: FailureEvent = {
        toolName: 'bash',
        exitCode: 1,
        timestamp: Date.now(),
        sessionId: 'test-session'
      };

      detector.recordFailure(event);

      detector.on('success', ({ sessionId }) => {
        expect(sessionId).toBe('test-session');
        done();
      });

      detector.recordSuccess('test-session');
    });
  });
});

describe('BashFailureDetector', () => {
  let bashDetector: BashFailureDetector;

  beforeEach(() => {
    bashDetector = new BashFailureDetector('test-session');
  });

  describe('isFailure', () => {
    it('should return true for non-zero exit code', () => {
      expect(bashDetector.isFailure(1)).toBe(true);
      expect(bashDetector.isFailure(127)).toBe(true);
    });

    it('should return false for exit code 0', () => {
      expect(bashDetector.isFailure(0)).toBe(false);
    });

    it('should detect errors in stderr even with exit code 0', () => {
      expect(bashDetector.isFailure(0, 'command not found')).toBe(true);
      expect(bashDetector.isFailure(0, 'No such file')).toBe(true);
      expect(bashDetector.isFailure(0, 'Permission denied')).toBe(true);
    });

    it('should return false for success with no error patterns', () => {
      expect(bashDetector.isFailure(0, 'file created successfully')).toBe(false);
    });

    it('should return false for undefined exit code', () => {
      expect(bashDetector.isFailure(undefined)).toBe(false);
    });
  });

  describe('record and success', () => {
    it('should record failures and track pressure', () => {
      bashDetector.record({
        toolName: 'bash',
        exitCode: 1,
        timestamp: Date.now()
      });

      expect(bashDetector.getConsecutiveFailures()).toBe(1);
      expect(bashDetector.getPressureLevel()).toBeGreaterThanOrEqual(1);
    });

    it('should reset consecutive failures on success', () => {
      bashDetector.record({ toolName: 'bash', exitCode: 1, timestamp: Date.now() });
      bashDetector.record({ toolName: 'bash', exitCode: 1, timestamp: Date.now() });
      bashDetector.success();

      expect(bashDetector.getConsecutiveFailures()).toBe(0);
    });
  });
});

describe('Global Failure Detector', () => {
  it('should be instance of FailureDetector', () => {
    expect(globalFailureDetector).toBeInstanceOf(FailureDetector);
  });
});