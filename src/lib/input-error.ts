/**
 * The caller sent something the tool cannot use (a wrong passphrase, an invalid query, an oversized image).
 * Analytics records it as a rejected run, not a server error, so the Errors page shows real faults only.
 */
export class InputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InputError";
  }
}
