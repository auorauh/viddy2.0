#!/usr/bin/env tsx

/**
 * Comprehensive test runner for the MongoDB User Projects feature
 * 
 * This script runs all test suites in the correct order and generates
 * a comprehensive report of the test results.
 */

import { execSync } from 'child_process';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { getTestConfig, TestReporter, testSuites } from './test-suite.config';

interface TestSuiteResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  output: string;
  error?: string;
}

class ComprehensiveTestRunner {
  private config = getTestConfig();
  private reporter = new TestReporter();
  private results: TestSuiteResult[] = [];
  private startTime = Date.now();

  async run() {
    console.log('🚀 Starting Comprehensive Test Suite');
    console.log('=====================================');
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Test Environment: ${process.env.TEST_ENV || 'development'}`);
    console.log(`Configuration:`, this.config);
    console.log('');

    // Run test suites in order
    await this.runTestSuite('unit', 'Unit Tests');
    await this.runTestSuite('integration', 'Integration Tests');
    await this.runTestSuite('e2e', 'End-to-End Tests');
    await this.runTestSuite('performance', 'Performance Tests');
    
    // Only run load tests in CI or production environments
    if (process.env.TEST_ENV === 'ci' || process.env.TEST_ENV === 'production') {
      await this.runTestSuite('load', 'Load Tests');
    } else {
      console.log('⏭️  Skipping load tests (not in CI/production environment)');
      this.results.push({
        name: 'Load Tests',
        status: 'skipped',
        duration: 0,
        output: 'Skipped in development environment'
      });
    }

    // Generate final report
    await this.generateReport();
  }

  private async runTestSuite(suiteKey: keyof typeof testSuites, displayName: string) {
    console.log(`\n📋 Running ${displayName}...`);
    console.log('─'.repeat(50));

    const suite = testSuites[suiteKey];
    const startTime = Date.now();

    try {
      // Build the vitest command
      const command = this.buildTestCommand(suite);
      console.log(`Command: ${command}`);

      // Execute the test suite
      const output = execSync(command, {
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: suite.timeout || 30000
      });

      const duration = Date.now() - startTime;
      
      console.log(`✅ ${displayName} completed in ${duration}ms`);
      
      this.results.push({
        name: displayName,
        status: 'passed',
        duration,
        output
      });

      // Parse output for individual test results
      this.parseTestOutput(output, suiteKey);

    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      console.log(`❌ ${displayName} failed after ${duration}ms`);
      console.log(`Error: ${error.message}`);
      
      this.results.push({
        name: displayName,
        status: 'failed',
        duration,
        output: error.stdout || '',
        error: error.message
      });
    }
  }

  private buildTestCommand(suite: any): string {
    let command = 'npx vitest run --reporter=verbose';
    
    // Add pattern matching
    if (suite.pattern) {
      command += ` "${suite.pattern}"`;
    }

    // Add exclusions
    if (suite.exclude) {
      suite.exclude.forEach((pattern: string) => {
        command += ` --exclude="${pattern}"`;
      });
    }

    // Add timeout
    if (suite.timeout) {
      command += ` --testTimeout=${suite.timeout}`;
    }

    // Add parallel/sequential execution
    if (suite.parallel === false) {
      command += ' --no-threads';
    }

    return command;
  }

  private parseTestOutput(output: string, suiteKey: string) {
    // Simple parsing of vitest output
    // In a real implementation, you might want to use vitest's JSON reporter
    const lines = output.split('\n');
    
    lines.forEach(line => {
      if (line.includes('✓') || line.includes('PASS')) {
        // Extract test name and duration if possible
        const testName = this.extractTestName(line);
        if (testName) {
          this.reporter.addResult({
            suite: suiteKey,
            name: testName,
            status: 'passed',
            duration: this.extractDuration(line) || 0
          });
        }
      } else if (line.includes('✗') || line.includes('FAIL')) {
        const testName = this.extractTestName(line);
        if (testName) {
          this.reporter.addResult({
            suite: suiteKey,
            name: testName,
            status: 'failed',
            duration: this.extractDuration(line) || 0,
            error: 'Test failed'
          });
        }
      }
    });
  }

  private extractTestName(line: string): string | null {
    // Simple extraction - in practice, you'd want more robust parsing
    const match = line.match(/(?:✓|✗|PASS|FAIL)\s+(.+?)(?:\s+\(\d+ms\))?$/);
    return match ? match[1].trim() : null;
  }

  private extractDuration(line: string): number | null {
    const match = line.match(/\((\d+)ms\)/);
    return match ? parseInt(match[1], 10) : null;
  }

  private async generateReport() {
    const totalDuration = Date.now() - this.startTime;
    
    console.log('\n📊 Comprehensive Test Report');
    console.log('============================');
    
    // Suite-level results
    console.log('\nSuite Results:');
    this.results.forEach(result => {
      const status = result.status === 'passed' ? '✅' : 
                    result.status === 'failed' ? '❌' : '⏭️';
      console.log(`${status} ${result.name}: ${result.duration}ms`);
      
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });

    // Overall statistics
    const passed = this.results.filter(r => r.status === 'passed').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    const skipped = this.results.filter(r => r.status === 'skipped').length;
    const total = this.results.length;

    console.log('\nOverall Statistics:');
    console.log(`Total Suites: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Success Rate: ${total > 0 ? ((passed / total) * 100).toFixed(1) : 0}%`);
    console.log(`Total Duration: ${totalDuration}ms`);

    // Individual test results from reporter
    const reporterSummary = this.reporter.getSummary();
    console.log('\nIndividual Test Statistics:');
    console.log(`Total Tests: ${reporterSummary.total}`);
    console.log(`Passed: ${reporterSummary.passed}`);
    console.log(`Failed: ${reporterSummary.failed}`);
    console.log(`Test Pass Rate: ${reporterSummary.passRate.toFixed(1)}%`);
    console.log(`Average Test Duration: ${reporterSummary.avgDuration.toFixed(2)}ms`);

    // Generate detailed report
    const detailedReport = this.reporter.generateReport();
    
    if (detailedReport.failedTests.length > 0) {
      console.log('\nFailed Tests:');
      detailedReport.failedTests.forEach(test => {
        console.log(`❌ ${test.suite}/${test.name}: ${test.error || 'Unknown error'}`);
      });
    }

    if (detailedReport.recommendations.length > 0) {
      console.log('\nRecommendations:');
      detailedReport.recommendations.forEach(rec => {
        console.log(`💡 ${rec}`);
      });
    }

    // Save report to file
    await this.saveReportToFile({
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      testEnvironment: process.env.TEST_ENV || 'development',
      configuration: this.config,
      suiteResults: this.results,
      overallStats: {
        totalSuites: total,
        passed,
        failed,
        skipped,
        successRate: total > 0 ? (passed / total) * 100 : 0,
        totalDuration
      },
      individualTestStats: reporterSummary,
      detailedReport
    });

    // Exit with appropriate code
    const hasFailures = failed > 0 || reporterSummary.failed > 0;
    if (hasFailures) {
      console.log('\n❌ Tests completed with failures');
      process.exit(1);
    } else {
      console.log('\n✅ All tests completed successfully');
      process.exit(0);
    }
  }

  private async saveReportToFile(report: any) {
    const reportsDir = join(process.cwd(), 'test-reports');
    
    if (!existsSync(reportsDir)) {
      mkdirSync(reportsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `comprehensive-test-report-${timestamp}.json`;
    const filepath = join(reportsDir, filename);

    writeFileSync(filepath, JSON.stringify(report, null, 2));
    
    console.log(`\n📄 Detailed report saved to: ${filepath}`);
  }
}

// Run the comprehensive test suite
if (require.main === module) {
  const runner = new ComprehensiveTestRunner();
  runner.run().catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

export { ComprehensiveTestRunner };