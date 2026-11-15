/** Print just one element (a worksheet, flashcards…) instead of the whole screen. */
export function printOne(el: HTMLElement | null | undefined) {
  if (!el) return;
  el.classList.add('print-target');
  document.body.dataset.print = 'one';
  const done = () => { el.classList.remove('print-target'); delete document.body.dataset.print; window.removeEventListener('afterprint', done); };
  window.addEventListener('afterprint', done);
  window.print();
  setTimeout(done, 1500); // some browsers do not fire afterprint
}
