export function toSubaccountBytes32(
  address: string,
  name = "default",
): `0x${string}` {
  const addrHex = address.slice(2).toLowerCase();

  const nameBytes = new TextEncoder().encode(name);
  const nameHex = Array.from(nameBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .padEnd(24, "0");
  return `0x${addrHex}${nameHex}` as `0x${string}`;
}
