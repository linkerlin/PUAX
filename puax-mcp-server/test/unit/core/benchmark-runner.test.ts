/**
 * Unit tests for Benchmark Runner
 */

import {
  BenchmarkRunner,
  BenchmarkScenario,
  globalBenchmarkRunner,
  BenchmarkReport
} from '../../../src/evals/benchmark-runner.js';

describe('BenchmarkRunner', () => {
  let runner: BenchmarkRunner;

  beforeEach(() => {
    runner = new BenchmarkRunner();
  });

  describe('Built-in scenarios', () => {
    it('should have 9 built-in benchmark scenarios', () => {
      const scenarios = runner.getScenarios();
      expect(scenarios.length).toBe(9);
    });

    it('should include consecutive_bash_failure scenario', () => {
      const scenarios = runner.getScenarios();
      expect(scenarios.some(s => s.name === 'consecutive_bash_failure')).toBe(true);
    });

    it('should include hidden_file_access_attempt scenario', () => {
      const scenarios = runner.getScenarios();
      expect(scenarios.some(s => s.name === 'hidden_file_access_attempt')).toBe(true);
    });

    it('should include giving_up_language scenario', () => {
      const scenarios = runner.getScenarios();
      expect(scenarios.some(s => s.name === 'giving_up_language')).toBe(true);
    });

    it('should include methodology_routing scenario', () => {
      const scenarios = runner.getScenarios();
      expect(scenarios.some(s => s.name === 'methodology_routing')).toBe(true);
    });

    it('should include four_power_separation scenario', () => {
      const scenarios = runner.getScenarios();
      expect(scenarios.some(s => s.name === 'four_power_separation')).toBe(true);
    });

    it('should include user_frustration_intercept scenario', () => {
      const scenarios = runner.getScenarios();
      expect(scenarios.some(s => s.name === 'user_frustration_intercept')).toBe(true);
    });

    it('should include enterprise_flavor_selection scenario', () => {
      const scenarios = runner.getScenarios();
      expect(scenarios.some(s => s.name === 'enterprise_flavor_selection')).toBe(true);
    });

    it('should include pressure_escalation scenario', () => {
      const scenarios = runner.getScenarios();
      expect(scenarios.some(s => s.name === 'pressure_escalation')).toBe(true);
    });

    it('should include anti_cheat_comprehensive scenario', () => {
      const scenarios = runner.getScenarios();
      expect(scenarios.some(s => s.name === 'anti_cheat_comprehensive')).toBe(true);
    });
  });

  describe('Scenario structure', () => {
    it('should have required fields for each scenario', () => {
      const scenarios = runner.getScenarios();
      scenarios.forEach(scenario => {
        expect(scenario.name).toBeDefined();
        expect(scenario.description).toBeDefined();
        expect(scenario.prompt).toBeDefined();
        expect(scenario.expectedBehaviors).toBeDefined();
        expect(scenario.failurePatterns).toBeDefined();
        expect(scenario.metrics).toBeDefined();
        expect(scenario.metrics.length).toBeGreaterThan(0);
      });
    });

    it('should have metrics with measure functions', () => {
      const scenarios = runner.getScenarios();
      scenarios.forEach(scenario => {
        scenario.metrics.forEach(metric => {
          expect(metric.name).toBeDefined();
          expect(metric.description).toBeDefined();
          expect(typeof metric.measure).toBe('function');
        });
      });
    });
  });

  describe('run', () => {
    it('should execute all scenarios by default', async () => {
      const report = await runner.run();
      expect(report.totalScenarios).toBe(9);
      expect(report.results.length).toBe(9);
    });

    it('should execute specific scenarios when specified', async () => {
      const report = await runner.run(['consecutive_bash_failure', 'giving_up_language']);
      expect(report.totalScenarios).toBe(2);
      expect(report.results.length).toBe(2);
    });

    it('should return results for each scenario', async () => {
      const report = await runner.run(['consecutive_bash_failure']);
      expect(report.results[0].scenario).toBe('consecutive_bash_failure');
      expect(report.results[0].metrics).toBeDefined();
    });

    it('should include improvement metrics in report', async () => {
      const report = await runner.run(['consecutive_bash_failure']);
      expect(report.summary).toBeDefined();
      expect(report.summary.fixCountImprovement).toBeGreaterThan(0);
      expect(report.summary.verificationCountImprovement).toBeGreaterThan(0);
    });

    it('should calculate overall score', async () => {
      const report = await runner.run();
      expect(report.overallScore).toBeGreaterThanOrEqual(0);
      expect(report.overallScore).toBeLessThanOrEqual(100);
    });

    it('should track passed and failed scenarios', async () => {
      const report = await runner.run();
      expect(report.passedScenarios + report.failedScenarios).toBe(report.totalScenarios);
    });
  });

  describe('generateMarkdownReport', () => {
    it('should generate valid markdown', async () => {
      const report = await runner.run();
      const markdown = runner.generateMarkdownReport(report);

      expect(markdown).toContain('# PUAX Benchmark Report');
      expect(markdown).toContain('## Summary');
      expect(markdown).toContain('## Results');
      expect(markdown).toContain('## Improvement Metrics');
    });

    it('should include overall score in report', async () => {
      const report = await runner.run();
      const markdown = runner.generateMarkdownReport(report);

      expect(markdown).toContain(`Overall Score**: ${report.overallScore}%`);
    });

    it('should show PASSED for score >= 80', async () => {
      const report: BenchmarkReport = {
        timestamp: new Date().toISOString(),
        totalScenarios: 10,
        passedScenarios: 10,
        failedScenarios: 0,
        overallScore: 100,
        results: [],
        summary: {
          fixCountImprovement: 0.36,
          verificationCountImprovement: 0.65,
          toolCallImprovement: 0.50,
          hiddenIssueDiscoveryImprovement: 0.50
        }
      };

      const markdown = runner.generateMarkdownReport(report);
      expect(markdown).toContain('✅ PASSED');
    });

    it('should show FAILED for score < 80', async () => {
      const report: BenchmarkReport = {
        timestamp: new Date().toISOString(),
        totalScenarios: 10,
        passedScenarios: 5,
        failedScenarios: 5,
        overallScore: 50,
        results: [],
        summary: {
          fixCountImprovement: 0.36,
          verificationCountImprovement: 0.65,
          toolCallImprovement: 0.50,
          hiddenIssueDiscoveryImprovement: 0.50
        }
      };

      const markdown = runner.generateMarkdownReport(report);
      expect(markdown).toContain('❌ FAILED');
    });
  });
});

describe('Global Benchmark Runner', () => {
  it('should be instance of BenchmarkRunner', () => {
    expect(globalBenchmarkRunner).toBeInstanceOf(BenchmarkRunner);
  });

  it('should have 9 built-in scenarios', () => {
    expect(globalBenchmarkRunner.getScenarios().length).toBe(9);
  });
});