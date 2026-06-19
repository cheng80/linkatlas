export type HttpTransport = (
  input: URL,
  init: RequestInit & { readonly signal: AbortSignal },
) => Promise<Response>;

export type OllamaProviderOptions = {
  readonly baseUrl: string;
  readonly transport?: HttpTransport;
  readonly timeoutMs?: number;
};

export function defaultHttpTransport(
  input: URL,
  init: RequestInit & { readonly signal: AbortSignal },
): Promise<Response> {
  return fetch(input, init);
}
