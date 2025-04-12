import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Check if we're in a static deployment without a backend
const isStaticDeployment = import.meta.env.PROD && !import.meta.env.VITE_HAS_BACKEND;

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
): Promise<Response> {
  // For static deployments, return mock responses
  if (isStaticDeployment) {
    // Create a mock response
    const mockResponse = new Response(
      JSON.stringify({ success: true, message: "Offline mode - API calls are simulated" }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    return mockResponse;
  }

  // Normal API request for non-static deployments
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
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
    // For static deployments, return empty data
    if (isStaticDeployment) {
      console.log(`Static deployment - Query for ${queryKey[0]} was intercepted`);
      return null;
    }

    // Normal query behavior
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
