export function tokenBridge(): string {
  return 'token-bridge';
}

/**
 * Server component that injects UI tokens into the page as a JSON script tag.
 * Client-side code can then read these tokens to resolve UI components.
 */
export function TokenInjector({ tokens }: { tokens: Record<string, unknown> }) {
  return (
    <script
      id="__devxp-tokens__"
      type="application/json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(tokens) }}
    />
  );
}
