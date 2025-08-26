/**
 * Comprehensive test suite configuration and runner
 */

export interface TestSuiteConfig {
  // Performance test thresholds
  performance: {
    userCreation: {
      maxDuration: number; // milliseconds
      batchSize: number;
    };
    projectOperations: {
      maxDuration: number;
      batchSize: number;
    };
    scriptOperations: {
      maxDuration: number;
      batchSize: number;
    };
    searchOperations: {
      maxDuration: number;
      resultLimit: number;
    };
    concurrentOperations: {
      maxDuration: number;
      concurrencyLevel: number;
    };
  };

  // Load test parameters
  loadTest: {
    users: number;
    projectsPerUser: number;
    scriptsPerProject: number;
    concurrentRequests: number;
  };

  // Database test configuration
  database: {
    connectionTimeout: number;
    operationTimeout: number;
    maxPoolSize: number;
  };

  // API test configuration
  api: {
    requestTimeout: number;
    maxRetries: number;
    rateLimitDelay: number;
  };

  // Test data configuration
  testData: {
    cleanupAfterTests: boolean;
    preserveFailureData: boolean;
    seedDataSize: 'small' | 'medium' | 'large';
  };
}

export const defaultTestConfig: TestSuiteConfig = {
  performance: {
    userCreation: {
      maxDuration: 10000, // 10 seconds for 100 users
      batchSize: 100
    },
    projectOperations: {
      maxDuration: 15000, // 15 seconds for 50 projects
      batchSize: 50
    },
    scriptOperations: {
      maxDuration: 20000, // 20 seconds for 200 scripts
      batchSize: 200
    },
    searchOperations: {
      maxDuration: 3000, // 3 seconds for search
      resultLimit: 50
    },
    concurrentOperations: {
      maxDuration: 8000, // 8 seconds for concurrent ops
      concurrencyLevel: 20
    }
  },

  loadTest: {
    users: 10,
    projectsPerUser: 5,
    scriptsPerProject: 10,
    concurrentRequests: 50
  },

  database: {
    connectionTimeout: 30000,
    operationTimeout: 10000,
    maxPoolSize: 10
  },

  api: {
    requestTimeout: 5000,
    maxRetries: 3,
    rateLimitDelay: 100
  },

  testData: {
    cleanupAfterTests: true,
    preserveFailureData: false,
    seedDataSize: 'medium'
  }
};

/**
 * Test suite categories and their configurations
 */
export const testSuites = {
  unit: {
    name: 'Unit Tests',
    pattern: '**/*.test.ts',
    exclude: ['**/*.integration.test.ts', '**/*.e2e.test.ts', '**/*.performance.test.ts'],
    timeout: 5000,
    parallel: true
  },

  integration: {
    name: 'Integration Tests',
    pattern: '**/*.integration.test.ts',
    timeout: 30000,
    parallel: false, // Sequential to avoid database conflicts
    setup: ['database']
  },

  e2e: {
    name: 'End-to-End Tests',
    pattern: '**/*.e2e.test.ts',
    timeout: 60000,
    parallel: false,
    setup: ['database', 'server']
  },

  performance: {
    name: 'Performance Tests',
    pattern: '**/*.performance.test.ts',
    timeout: 120000, // 2 minutes
    parallel: false,
    setup: ['database'],
    requirements: {
      minMemory: '512MB',
      isolatedEnvironment: true
    }
  },

  load: {
    name: 'Load Tests',
    pattern: '**/*load*.test.ts',
    timeout: 300000, // 5 minutes
    parallel: false,
    setup: ['database', 'server'],
    requirements: {
      minMemory: '1GB',
      isolatedEnvironment: true
    }
  }
};

/**
 * Test environment configurations
 */
export const testEnvironments = {
  development: {
    ...defaultTestConfig,
    performance: {
      ...defaultTestConfig.performance,
      userCreation: { maxDuration: 15000, batchSize: 50 },
      projectOperations: { maxDuration: 20000, batchSize: 25 },
      scriptOperations: { maxDuration: 30000, batchSize: 100 }
    },
    loadTest: {
      users: 5,
      projectsPerUser: 3,
      scriptsPerProject: 5,
      concurrentRequests: 10
    }
  },

  ci: {
    ...defaultTestConfig,
    performance: {
      ...defaultTestConfig.performance,
      userCreation: { maxDuration: 20000, batchSize: 50 },
      projectOperations: { maxDuration: 25000, batchSize: 25 },
      scriptOperations: { maxDuration: 40000, batchSize: 100 }
    },
    loadTest: {
      users: 3,
      projectsPerUser: 2,
      scriptsPerProject: 3,
      concurrentRequests: 5
    },
    testData: {
      cleanupAfterTests: true,
      preserveFailureData: true,
      seedDataSize: 'small'
    }
  },

  production: {
    ...defaultTestConfig,
    loadTest: {
      users: 50,
      projectsPerUser: 10,
      scriptsPerProject: 20,
      concurrentRequests: 100
    },
    testData: {
      cleanupAfterTests: true,
      preserveFailureData: true,
      seedDataSize: 'large'
    }
  }
};

/**
 * Gets the test configuration for the current environment
 */
export function getTestConfig(): TestSuiteConfig {
  const env = process.env.NODE_ENV || 'development';
  const testEnv = process.env.TEST_ENV || env;

  switch (testEnv) {
    case 'ci':
      return testEnvironments.ci;
    case 'production':
      return testEnvironments.production;
    default:
      return testEnvironments.development;
  }
}

/**
 * Test result tracking and reporting
 */
export interface TestResult {
  suite: string;
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  metrics?: {
    memoryUsage?: number;
    dbOperations?: number;
    apiCalls?: number;
  };
}

export class TestReporter {
  private results: TestResult[] = [];
  private startTime: number = Date.now();

  addResult(result: TestResult) {
    this.results.push(result);
  }

  getResults() {
    return this.results;
  }

  getSummary() {
    const total = this.results.length;
    const passed = this.results.filter(r => r.status === 'passed').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    const skipped = this.results.filter(r => r.status === 'skipped').length;
    const totalDuration = Date.now() - this.startTime;

    return {
      total,
      passed,
      failed,
      skipped,
      passRate: total > 0 ? (passed / total) * 100 : 0,
      totalDuration,
      avgDuration: total > 0 ? this.results.reduce((sum, r) => sum + r.duration, 0) / total : 0
    };
  }

  generateReport() {
    const summary = this.getSummary();
    const failedTests = this.results.filter(r => r.status === 'failed');

    return {
      summary,
      failedTests,
      performanceMetrics: this.getPerformanceMetrics(),
      recommendations: this.getRecommendations()
    };
  }

  private getPerformanceMetrics() {
    const performanceTests = this.results.filter(r => r.suite.includes('performance'));
    
    return {
      slowestTests: this.results
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 10),
      averageDurationBySuite: this.getAverageDurationBySuite(),
      memoryUsage: performanceTests
        .filter(r => r.metrics?.memoryUsage)
        .map(r => ({ name: r.name, memory: r.metrics!.memoryUsage }))
    };
  }

  private getAverageDurationBySuite() {
    const suites = [...new Set(this.results.map(r => r.suite))];
    
    return suites.map(suite => {
      const suiteResults = this.results.filter(r => r.suite === suite);
      const avgDuration = suiteResults.reduce((sum, r) => sum + r.duration, 0) / suiteResults.length;
      
      return { suite, avgDuration, count: suiteResults.length };
    });
  }

  private getRecommendations() {
    const recommendations = [];
    const summary = this.getSummary();

    if (summary.passRate < 95) {
      recommendations.push('Test pass rate is below 95%. Review failed tests and improve test reliability.');
    }

    if (summary.avgDuration > 5000) {
      recommendations.push('Average test duration is high. Consider optimizing slow tests or test setup.');
    }

    const slowTests = this.results.filter(r => r.duration > 10000);
    if (slowTests.length > 0) {
      recommendations.push(`${slowTests.length} tests are taking longer than 10 seconds. Consider optimization.`);
    }

    return recommendations;
  }
}

/**
 * Test utilities for setup and teardown
 */
export const testUtils = {
  /**
   * Waits for a condition to be met with timeout
   */
  async waitFor(
    condition: () => Promise<boolean> | boolean,
    timeout: number = 5000,
    interval: number = 100
  ): Promise<void> {
    const start = Date.now();
    
    while (Date.now() - start < timeout) {
      if (await condition()) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    throw new Error(`Condition not met within ${timeout}ms`);
  },

  /**
   * Retries an operation with exponential backoff
   */
  async retry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  },

  /**
   * Creates a timeout promise
   */
  timeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms);
    });
  },

  /**
   * Races an operation against a timeout
   */
  async withTimeout<T>(operation: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      operation,
      this.timeout(timeoutMs)
    ]);
  }
};