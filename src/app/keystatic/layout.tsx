import type { Metadata } from "next";
import KeystaticApp from "./keystatic";

/* The CMS admin UI. Keystatic renders the whole app here; the nested page is a stub. */

export const metadata: Metadata = {
  title: "Content editor",
  robots: { index: false, follow: false },
};

export default function KeystaticLayout() {
  return <KeystaticApp />;
}
