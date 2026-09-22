export {};
// One initializer for all documentation previews. Keep iframe documents inert
// until their reserved canvas approaches the viewport; native srcdoc lazy loading
// still initialized every demo on the component reference page.
const frames = document.querySelectorAll<HTMLIFrameElement>('iframe[data-preview-srcdoc]');
const resize = new ResizeObserver(entries => {
  for (const entry of entries) {
    const frame = entry.target.querySelector<HTMLIFrameElement>('iframe');
    if (!frame || !entry.contentRect.width) continue;
    const scale = entry.contentRect.width / 1920;
    frame.style.transform = 'scale(' + scale + ')';
    frame.style.height = (entry.contentRect.height / scale) + 'px';
  }
});
const visible = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    const frame = entry.target as HTMLIFrameElement;
    visible.unobserve(frame);
    frame.loading = 'eager';
    frame.srcdoc = frame.dataset.previewSrcdoc || '';
    delete frame.dataset.previewSrcdoc;
  }
}, { rootMargin: '200px 0px' });
for (const frame of frames) {
  if (frame.classList.contains('atom-frame')) {
    frame.addEventListener('load', () => {
      const doc = frame.contentDocument;
      if (!doc) return;
      const fit = () => {
        const content = doc.body.firstElementChild;
        if (content) frame.style.height = Math.max(120, Math.min(440, Math.ceil(content.getBoundingClientRect().height + 48))) + 'px';
      };
      requestAnimationFrame(() => requestAnimationFrame(fit));
      void doc.fonts.ready.then(fit);
    });
  } else if (frame.parentElement) resize.observe(frame.parentElement);
  visible.observe(frame);
}
