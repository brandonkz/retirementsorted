document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.nav-toggle').forEach((button) => {
    const targetSelector =
      button.getAttribute('data-target') || button.getAttribute('data-nav-target');
    const nav = targetSelector
      ? document.querySelector(targetSelector)
      : button.parentElement.querySelector('.nav, .header-nav');

    if (!nav) {
      return;
    }

    button.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('is-open');
      button.setAttribute('aria-expanded', String(isOpen));
    });

    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        if (nav.classList.contains('is-open')) {
          nav.classList.remove('is-open');
          button.setAttribute('aria-expanded', 'false');
        }
      });
    });
  });
});
