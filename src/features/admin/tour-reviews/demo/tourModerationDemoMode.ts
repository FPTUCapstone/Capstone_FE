/**
 * Demo gate for tour moderation fixtures.
 *
 * Follows the project convention: fixtures are reachable only in a non-production build
 * with NEXT_PUBLIC_ENABLE_DEMO_FIXTURES=true AND an explicit `?demo=1` query parameter.
 * A production build ignores the query parameter entirely.
 */
export function isTourModerationDemoAllowedInCurrentEnv(): boolean {
  return (
    process.env.NODE_ENV !== 'production' &&
    process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES === 'true'
  );
}

export function isTourModerationDemoRequested(demoParam: string | null | undefined): boolean {
  return demoParam === '1' && isTourModerationDemoAllowedInCurrentEnv();
}
