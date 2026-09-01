// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

export function initViewportHeight(): void {
  const root = document.documentElement;
  const setVh = () => {
    root.style.setProperty('--clvq-vh', `${window.innerHeight}px`);
  };
  setVh();
  window.addEventListener('resize', setVh);
  window.addEventListener('orientationchange', setVh);
  window.visualViewport?.addEventListener('resize', setVh);
}
