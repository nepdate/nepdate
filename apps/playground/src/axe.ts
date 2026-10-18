/** TEST-040: run axe-core on the page (open a picker first to include the panel). */
export async function runAxe(): Promise<{ ok: boolean; text: string }> {
  const { default: axe } = await import('axe-core');
  const result = await axe.run(document.body, { resultTypes: ['violations'] });
  const ids = result.violations.map(
    (violation) => `${violation.id} (${violation.nodes.length})`,
  );
  (window as unknown as { __axe?: unknown }).__axe = result.violations;

  return ids.length === 0
    ? { ok: true, text: 'axe: no violations' }
    : { ok: false, text: `axe: ${ids.join(', ')}` };
}
