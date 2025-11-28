import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  options?: { isFormData?: boolean; headers?: Record<string, string> },
): Promise<Response> {
  // Determine if we're sending FormData
  const isFormData = options?.isFormData || data instanceof FormData;
  
  // Set up appropriate headers and body
  let headers: Record<string, string> = {};
  let body: any = undefined;
  
  if (data) {
    if (isFormData) {
      // FormData should not have Content-Type set
      body = data;
    } else {
      // JSON data
      headers = { "Content-Type": "application/json", ...options?.headers };
      body = JSON.stringify(data);
    }
  } else if (options?.headers) {
    headers = options.headers;
  }

  const res = await fetch(url, {
    method,
    headers,
    body,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
