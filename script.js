/* ==========================================================================
   SITE SCRIPT
   Three small, independent behaviors — no framework, no build step:
   1. Hamburger menu open/close (mobile nav)
   2. Dark/light theme toggle (never persisted — always light on page load)
   3. Active-page underline in the nav, computed from the current URL
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ---- 1. Hamburger menu ---- */
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('nav-links');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // Close the mobile menu after a link is tapped, so navigating away
    // doesn't leave the panel open when the next page loads.
    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---- 2. Theme toggle ---- */
  // Deliberately does NOT read localStorage or prefers-color-scheme on load.
  // Every fresh page load starts in light mode (no data-theme attribute set),
  // matching the CSS default in styles.css. The toggle only ever changes the
  // current page's state in memory — it does not persist across page loads
  // or reloads, by design.
  const themeToggle = document.getElementById('theme-toggle');

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const html = document.documentElement;
      const isDark = html.getAttribute('data-theme') === 'dark';
      html.setAttribute('data-theme', isDark ? 'light' : 'dark');
      themeToggle.textContent = isDark ? '☾' : '☀';
      themeToggle.setAttribute(
        'aria-label',
        isDark ? 'Switch to dark mode' : 'Switch to light mode'
      );
    });
  }

  /* ---- 3. Active-page nav indicator ---- */
  // Matches based on the first path segment (e.g. "journey") so both
  // /journey/index.html and /journey/entry-01.html highlight the same
  // "Journey" nav link. Root "/" or "/index.html" matches "Home".
  const currentPath = window.location.pathname;
  const currentSegment = currentPath.split('/').filter(Boolean)[0] || '';

  document.querySelectorAll('.nav-links a[data-page]').forEach((link) => {
    const linkPage = link.getAttribute('data-page');
    const isHome = linkPage === 'home' && currentSegment === '';
    const isSection = linkPage === currentSegment;

    if (isHome || isSection) {
      link.classList.add('active');
    }
  });

});