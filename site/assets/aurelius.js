// AureliusGPT demo: talks to /api/aurelius (the model) and optionally /api/justify (a GPT-4o grader).

(() => {
  const log = document.getElementById('chat-log');
  const form = document.getElementById('chat-form');
  const input = document.getElementById('chat-input');
  const send = document.getElementById('chat-send');
  const validator = document.getElementById('validator');
  const history = [];
  let busy = false;

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function addMessage(kind, who, text) {
    document.getElementById('chat-empty')?.remove();
    const el = document.createElement('div');
    el.className = `msg ${kind}`;
    const label = document.createElement('span');
    label.className = 'who';
    label.textContent = who;
    const body = document.createElement('div');
    body.className = 'text';
    if (text !== undefined) body.textContent = text;
    el.append(label, body);
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
    return body;
  }

  async function typeOut(el, text) {
    if (reduceMotion) { el.textContent = text; return; }
    el.textContent = '';
    for (const ch of text) {
      el.textContent += ch;
      log.scrollTop = log.scrollHeight;
      await new Promise((r) => setTimeout(r, 18));
    }
  }

  async function waitForWarmup(seconds) {
    const el = addMessage('note', 'server', '');
    for (let s = seconds; s > 0; s--) {
      el.textContent = `The model is waking up. Retrying in ${s}s…`;
      await new Promise((r) => setTimeout(r, 1000));
    }
    el.parentElement.remove();
  }

  async function ask(prompt, isRetry = false) {
    if (!isRetry) {
      addMessage('user', 'you', prompt);
      history.push({ role: 'user', content: prompt, timestamp: new Date() });
    }
    const pending = addMessage('aurelius', 'aurelius', '…');

    try {
      const res = await fetch('/api/aurelius', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputs: prompt,
          parameters: { max_new_tokens: 250, temperature: 0.8, top_p: 0.9, do_sample: true },
        }),
      });

      if (res.status === 503) {
        pending.parentElement.remove();
        await waitForWarmup(30);
        return ask(prompt, true);
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      let reply = (Array.isArray(data) ? data[0]?.generated_text : data.generated_text) || '';
      if (reply.startsWith(prompt)) reply = reply.slice(prompt.length);
      reply = reply.replace(/^\s*aurelius:\s*/i, '').trim() || 'The winds of wisdom are silent today. Try again.';

      history.push({ role: 'assistant', content: reply, timestamp: new Date() });
      await typeOut(pending, reply);

      if (validator.checked) await justify(prompt, reply);
    } catch (e) {
      pending.parentElement.className = 'msg error';
      pending.textContent = `The model didn’t answer (${e.message}). It may be starting up; try again in a minute.`;
    }
  }

  async function justify(prompt, reply) {
    try {
      const res = await fetch('/api/justify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_prompt: prompt, model_response: reply }),
      });
      if (!res.ok) return;
      const { justification } = await res.json();
      const el = addMessage('note', 'grader · gpt-4o');
      const html = window.marked ? marked.parse(justification) : justification;
      if (window.DOMPurify) el.innerHTML = DOMPurify.sanitize(html);
      else el.textContent = justification;
      log.scrollTop = log.scrollHeight;
    } catch (_) {}
  }

  async function submit(text) {
    const prompt = text.trim();
    if (!prompt || busy) return;
    busy = true;
    send.disabled = true;
    input.value = '';
    await ask(prompt);
    busy = false;
    send.disabled = false;
    input.focus();
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    submit(input.value);
  });

  document.getElementById('suggest').addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (btn) submit(btn.textContent);
  });

  document.getElementById('chat-export').addEventListener('click', () => {
    if (!history.length) return;
    const text = history
      .map((m) => `[${m.timestamp.toLocaleString()}] ${m.role === 'user' ? 'You' : 'Aurelius'}: ${m.content}`)
      .join('\n\n');
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: 'aurelius-conversation.txt' });
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });
})();
