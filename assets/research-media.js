// Start animations only on screen; honour reduced-motion preferences and manual pauses.
(() => {
 const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
 const cards = [...document.querySelectorAll('.research-media video')].map(video => {
  const button = video.parentElement.querySelector('button');
  const state = {video, button, visible:false, paused:false, manualPlay:false};
  const label = playing => {
   button.textContent = playing ? 'Pause animation' : 'Play animation';
   button.setAttribute('aria-label', `${button.textContent}: ${video.getAttribute('aria-label')}`);
  };
  state.update = () => {
   if (!state.visible || document.hidden || state.paused || (reduced.matches && !state.manualPlay)) {
    video.pause(); label(false); return;
   }
   if (!video.getAttribute('src')) video.src = video.dataset.src;
   video.muted = true;
   video.play().then(() => label(true)).catch(() => label(false));
  };
  button.hidden = false;
  label(false);
  button.addEventListener('click', () => {
   state.paused = !video.paused;
   state.manualPlay = !state.paused;
   state.update();
  });
  return state;
 });
 const observer = new IntersectionObserver(entries => {
  for (const entry of entries) {
   const state = cards.find(card => card.video === entry.target);
   state.visible = entry.isIntersecting;
   state.update();
  }
 }, {threshold:0.15});
 cards.forEach(card => observer.observe(card.video));
 reduced.addEventListener('change', () => {
  cards.forEach(card => {card.manualPlay = false; card.update();});
 });
 document.addEventListener('visibilitychange', () => cards.forEach(card => card.update()));
})();
