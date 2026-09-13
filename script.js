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
  // The initial theme (light by default, or dark if the visitor chose it
  // before) is set by the tiny inline script in each page's <head> —
  // that runs before this file loads, so there's no flash of the wrong
  // theme. This toggle just flips the current page's theme and saves the
  // choice to localStorage so it carries over to every other page and
  // future visits, until the visitor changes it again.
  const themeToggle = document.getElementById('theme-toggle');

  if (themeToggle) {
    // Sync the icon/label with the current theme
    const isDark =
      document.documentElement.getAttribute('data-theme') === 'dark';

    themeToggle.textContent = isDark ? '☀' : '☾';
    themeToggle.setAttribute(
      'aria-label',
      isDark ? 'Switch to light mode' : 'Switch to dark mode'
    );

    themeToggle.addEventListener('click', () => {
      const html = document.documentElement;
      const isDark = html.getAttribute('data-theme') === 'dark';

      const newTheme = isDark ? 'light' : 'dark';

      // Apply theme
      html.setAttribute('data-theme', newTheme);

      // Remember user's preference
      localStorage.setItem('theme', newTheme);

      // Update button
      themeToggle.textContent = newTheme === 'dark' ? '☀' : '☾';

      themeToggle.setAttribute(
        'aria-label',
        newTheme === 'dark'
          ? 'Switch to light mode'
          : 'Switch to dark mode'
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

  /* ---- 4. Entry list + pagination (data-driven) ----
     Any list/index page (Journey, Study, Research, Others) has:
       <section class="entry-list" id="entry-list" data-source="/journey/entries.json"></section>
       <nav class="pagination" id="pagination"></nav>
     This fetches that section's entries.json, sorts newest-first, splits
     into pages of PAGE_SIZE, and renders only the current page — reading
     ?page=N from the URL. Adding a new entry means editing entries.json
     only; this file and the section's index.html never need to change. */
  const PAGE_SIZE = 10;
  const entryListEl = document.getElementById('entry-list');
  const paginationEl = document.getElementById('pagination');

  if (entryListEl) {
    const source = entryListEl.getAttribute('data-source');

    fetch(source)
      .then((res) => {
        if (!res.ok) throw new Error(`Could not load ${source} (${res.status})`);
        return res.json();
      })
      .then((entries) => {
        entries.sort((a, b) => new Date(b.date) - new Date(a.date));

        const totalPages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
        const params = new URLSearchParams(window.location.search);
        let currentPage = parseInt(params.get('page'), 10) || 1;
        currentPage = Math.min(Math.max(currentPage, 1), totalPages);

        const start = (currentPage - 1) * PAGE_SIZE;
        const pageEntries = entries.slice(start, start + PAGE_SIZE);

        entryListEl.innerHTML = pageEntries.map((entry) => `
          <article class="entry">
            <span class="meta">${entry.displayDate}</span>
            <h2><a href="${entry.url}">${entry.title}</a></h2>
            <p>${entry.summary}</p>
          </article>
        `).join('');

        if (!paginationEl) return;

        // Fewer than PAGE_SIZE + 1 entries total → no page controls needed.
        if (totalPages <= 1) {
          paginationEl.innerHTML = '';
          return;
        }

        let numbers = '';
        for (let i = 1; i <= totalPages; i++) {
          numbers += `<a href="?page=${i}" class="${i === currentPage ? 'active' : ''}">${i}</a>`;
        }

        const prevDisabled = currentPage <= 1;
        const nextDisabled = currentPage >= totalPages;

        paginationEl.innerHTML = `
          <a href="${prevDisabled ? '#' : '?page=' + (currentPage - 1)}" class="pagination-prev"${prevDisabled ? ' aria-disabled="true"' : ''}>← Newer</a>
          <div class="pagination-numbers">${numbers}</div>
          <a href="${nextDisabled ? '#' : '?page=' + (currentPage + 1)}" class="pagination-next"${nextDisabled ? ' aria-disabled="true"' : ''}>Older →</a>
        `;
      })
      .catch((err) => {
        entryListEl.innerHTML = '<p class="meta">Could not load entries.</p>';
        console.error(err);
      });
  }

  /* ---- 5. Prev/next entry navigation (data-driven) ----
     Any entry/detail page has:
       <nav class="entry-nav" id="entry-nav" data-source="/journey/entries.json"></nav>
     This fetches that section's entries.json, sorts newest-first, finds
     the current page in the list by matching its URL, and links to the
     neighboring entries. Nothing is hardcoded per entry — reordering or
     adding entries in entries.json automatically updates every page's
     prev/next links. */
/* ---- 5. Prev/next entry navigation (data-driven) ---- */
  const entryNavEl = document.getElementById('entry-nav');

  if (entryNavEl) {
    const source = entryNavEl.getAttribute('data-source');

    fetch(source)
      .then((res) => {
        if (!res.ok) throw new Error(`Could not load ${source} (${res.status})`);
        return res.json();
      })
      .then((entries) => {
        // Sắp xếp bài mới nhất lên đầu
        entries.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Trích xuất tên file hiện tại từ URL (Ví dụ: "entry-02.html")
        const currentFilename = window.location.pathname.split('/').pop();

        // Tìm vị trí bài viết dựa trên tên file
        const currentIndex = entries.findIndex((entry) => {
          const entryFilename = entry.url.split('/').pop();
          return entryFilename === currentFilename;
        });

        if (currentIndex === -1) return;

        // Bài mới hơn (Newer) nằm ở chỉ số nhỏ hơn trong mảng đã sort
        // Bài cũ hơn (Older) nằm ở chỉ số lớn hơn
        const newer = entries[currentIndex - 1];
        const older = entries[currentIndex + 1];

        let html = '';
        if (newer) {
          html += `
            <a href="${newer.url}" class="entry-nav-prev">
              <span class="entry-nav-label">← Newer</span>
              <span class="entry-nav-title">${newer.title}</span>
            </a>`;
        }
        if (older) {
          html += `
            <a href="${older.url}" class="entry-nav-next">
              <span class="entry-nav-label">Older →</span>
              <span class="entry-nav-title">${older.title}</span>
            </a>`;
        }
        entryNavEl.innerHTML = html;
      })
      .catch((err) => console.error(err));
  }
});