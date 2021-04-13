/// Returns `true` if the 
export function isRunningUnderJest() {
    return process.env.JEST_WORKER_ID !== undefined;
}


/// Configures the mock database for the current test file.
export function setTestDb(name: string) {
    process.env.TEST_SUITE = name;
}


function trimSlashes(path: string): string {
    while (path.startsWith('/')) {
        path = path.substring(1);
    }
    return path;
}


/// Appends the given path to the API path (/api/v1), trimming the preceding slashes if necessary.
export function apiPath(path: string): string {
    path = trimSlashes(path);
    return `/api/v1/${path}`;
}


/// Creates a new function that would appends the given base path to the API path (/api/v1/base), trimming the preceding slashes if necessary.
export function makeApiPath(base: string): ((path: string) => string) {
    return (path: string) => apiPath(`${base}/${trimSlashes(path)}`);
}
