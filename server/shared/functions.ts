/// Returns `true` if the 
export function isRunningUnderJest() {
    return process.env.JEST_WORKER_ID !== undefined;
}


/// Configures the mock database for the current test file.
export function setTestDb(name: string) {
    process.env.TEST_SUITE = name;
}


/// Trims the preceding slashes in the given path.
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

/// Registers a user for testing purposes.
export async function register(agent: any): Promise<
    {
        email: string; password: string; token: string;
        calls_available: number;
        calls_made: number;
    }> {
    const creds = { email: `test-${(Math.random() * 100_000).toFixed(0)}`, password: 'test' };
    await agent
        .post('/api/v1/users/register')
        .send({ name: "test", ...creds, confirmation: 'test' }).expect(201);
    await agent.post("/api/v1/users/login").send(creds).expect(302);
    let resp = await agent.get("/api/v1/token/apply").send().expect(201);
    return { ...creds, ...resp.body };
}
