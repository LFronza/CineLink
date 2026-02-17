type TestLogEntry = {
  at: string;
  tag: string;
  payload?: Record<string, unknown>;
};

const TEST_LOG_MAX = 500;
const testLogs: TestLogEntry[] = [];

export function addTestLog(tag: string, payload?: Record<string, unknown>): void {
  testLogs.push({
    at: new Date().toISOString(),
    tag,
    payload
  });
  if (testLogs.length > TEST_LOG_MAX) {
    testLogs.splice(0, testLogs.length - TEST_LOG_MAX);
  }
}

export function getRecentTestLogs(limit = 150): TestLogEntry[] {
  const size = Math.max(1, Math.min(500, Math.floor(limit)));
  return testLogs.slice(-size);
}

export function clearTestLogs(): void {
  testLogs.length = 0;
}

