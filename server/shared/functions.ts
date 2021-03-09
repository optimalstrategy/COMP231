/// Returns `true` if the 
export function isRunningUnderJest() {
    return process.env.JEST_WORKER_ID !== undefined;
}

/// Configures the mock database for the current test file.
export function setTestDb(name: string) {
    process.env.TEST_SUITE = name;
}
