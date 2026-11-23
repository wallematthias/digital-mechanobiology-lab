(() => {
 const form = document.querySelector('#inquiry-form');
 if (!form) return;
 const status = form.querySelector('.form-status');
 form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const endpoint = form.dataset.endpoint;
  if (!endpoint) { status.textContent = 'Preview only — nothing was sent. The form will be connected before publication.'; return; }
  if (!/^https:\/\/formspree\.io\/f\/[a-zA-Z0-9]+$/.test(endpoint)) { status.textContent = 'The enquiry form is temporarily unavailable. Please try again later.'; return; }
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  status.textContent = 'Sending…';
  try {
   const response = await fetch(endpoint, {method:'POST',body:new FormData(form),headers:{Accept:'application/json'}});
   if (!response.ok) throw new Error('Submission failed');
   form.reset(); status.textContent = 'Thank you. Your enquiry has been sent.';
  } catch { status.textContent = 'Your enquiry could not be sent. Your message is still here; please try again.'; }
  finally { button.disabled = false; }
 });
})();
