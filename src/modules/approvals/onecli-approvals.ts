/**
 * OneCLI approval handler — stubbed out.
 *
 * OneCLI has been replaced by the native credential proxy (credential-proxy.ts).
 * This file is kept as a stub so any residual imports compile cleanly.
 */

export const ONECLI_ACTION = 'onecli_credential';

/** No-op stub: always returns false (nothing to resolve). */
export function resolveOneCLIApproval(_approvalId: string, _selectedOption: string): boolean {
  return false;
}

/** No-op stub: OneCLI handler is not started. */
export function startOneCLIApprovalHandler(_deliveryAdapter: unknown): void {
  // No-op: native credential proxy handles credentials without OneCLI.
}

/** No-op stub. */
export function stopOneCLIApprovalHandler(): void {
  // No-op.
}
