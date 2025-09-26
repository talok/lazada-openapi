import { createHmac } from "crypto";
function toSortedParamString(params) {
    const entries = Object.entries(params)
        .filter(([key, value]) => value !== undefined && value !== null && key !== "sign")
        .map(([key, value]) => [key, String(value)])
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    let result = "";
    for (const [k, v] of entries) {
        result += `${k}${v}`;
    }
    return result;
}
export function generateSignature(appSecret, path, params) {
    const baseString = `${path}${toSortedParamString(params)}`;
    const hmac = createHmac("sha256", appSecret);
    hmac.update(baseString, "utf8");
    return hmac.digest("hex").toUpperCase();
}
