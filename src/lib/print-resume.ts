/** Print/download PDF with filename based on document.title (browser Save as PDF). */
export function printResume(fullName?: string | null) {
  if (typeof window === "undefined") return;

  const previousTitle = document.title;
  const name = (fullName || "").trim() || "Resume";
  document.title = `Bahath Jobz - ${name}`;

  let restored = false;
  const restore = () => {
    if (restored) return;
    restored = true;
    document.title = previousTitle;
    window.removeEventListener("afterprint", restore);
  };

  window.addEventListener("afterprint", restore);
  window.print();
  // Fallback if afterprint does not fire in some browsers
  window.setTimeout(restore, 2000);
}
