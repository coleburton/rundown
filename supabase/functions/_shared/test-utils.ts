export function createMockSupabaseClient() {
  const mockQueryBuilder = {
    select: () => mockQueryBuilder,
    insert: () => mockQueryBuilder,
    update: () => mockQueryBuilder,
    eq: () => mockQueryBuilder,
    single: () => Promise.resolve({ data: null, error: null }),
  };

  return {
    from: () => mockQueryBuilder,
    auth: {
      getUser: () =>
        Promise.resolve({ data: { user: null }, error: null }),
    },
  };
}

export function createMockRequest(options: {
  method?: string;
  url?: string;
  body?: unknown;
  headers?: Record<string, string>;
}): Request {
  const {
    method = "GET",
    url = "http://localhost/",
    body,
    headers = {},
  } = options;

  return new Request(url, {
    method,
    headers: new Headers(headers),
    body: body ? JSON.stringify(body) : undefined,
  });
}

export const assertEquals = (a: unknown, b: unknown) => {
  if (a !== b) {
    throw new Error(`Expected ${a} to equal ${b}`);
  }
};

export const assertExists = (value: unknown) => {
  if (value === null || value === undefined) {
    throw new Error('Expected value to exist');
  }
};
