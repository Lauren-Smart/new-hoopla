import { cookies } from "next/headers";

const COOKIE = "wb_admin";

export function isAdmin() {
  return cookies().get(COOKIE)?.value === sessionValue();
}
export function grantAdmin() {
  cookies().set(COOKIE, sessionValue(), {
    httpOnly: true, secure: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30, path: "/",
  });
}
function sessionValue() {
  // Derived from the password so changing the password invalidates sessions.
  const pw = process.env.ADMIN_PASSWORD || "";
  let h = 0;
  for (let i = 0; i < pw.length; i++) h = (h * 31 + pw.charCodeAt(i)) >>> 0;
  return `ok-${h.toString(36)}`;
}
