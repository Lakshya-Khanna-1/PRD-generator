/** Tiny className-variant helper so we don't need class-variance-authority for a handful of components. */
export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
