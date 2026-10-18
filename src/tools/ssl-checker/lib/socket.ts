import tls from "node:tls";

export function openTls(options: tls.ConnectionOptions) {
  return tls.connect(options);
}
