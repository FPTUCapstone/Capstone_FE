/**
 * Demo gate for the pending operator application fixtures.
 *
 * Follows the project convention: fixtures are reachable only in a non-production build
 * with NEXT_PUBLIC_ENABLE_DEMO_FIXTURES=true AND an explicit `?demo=1` query parameter.
 * A production build ignores the query parameter entirely.
 */
export function isOperatorApplicationDemoRequested(demoParam: string | null | undefined): boolean {
  return (
    demoParam === '1' &&
    process.env.NODE_ENV !== 'production' &&
    process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES === 'true'
  );
}
