const TOTAL = 62;
let present = new Set();
let sessions = [];

window.onload = function () {
  const now = new Date();
  document.getElementById('dateBadge').textContent = now.toLocaleDateString('en-IN', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
  });
  renderGrid();
  update();
};

function renderGrid() {
  const q = document.getElementById('searchBox').value.trim();
  const g = document.getElementById('rollGrid');
  g.innerHTML = '';

  for (let i = 1; i <= TOTAL; i++) {
    if (q && !String(i).includes(q)) continue;

    const d = document.createElement('div');
    d.className = 'roll-btn ' + (present.has(i) ? 'present' : 'absent-mark');
    d.textContent = i;
    d.onclick = () => toggle(i);
    g.appendChild(d);
  }
}

function toggle(n) {
  if (present.has(n)) present.delete(n);
  else present.add(n);
  renderGrid();
  update();
}

function markAll(val) {
  if (val) {
    for (let i = 1; i <= TOTAL; i++) present.add(i);
  } else {
    present.clear();
  }
  renderGrid();
  update();
}

function update() {
  const p = present.size;
  const a = TOTAL - p;
  const pct = Math.round(p / TOTAL * 100);

  document.getElementById('mPresent').textContent = p;
  document.getElementById('mAbsent').textContent = a;

  const mPctEl = document.getElementById('mPct');
  mPctEl.textContent = pct + '%';
  mPctEl.className = 'metric-value ' + (pct >= 75 ? 'green' : pct >= 50 ? 'amber' : 'red');

  const bar = document.getElementById('progressBar');
  bar.style.width = pct + '%';
  bar.className = 'progress-bar' + (pct >= 75 ? '' : pct >= 50 ? ' warn' : ' danger');

  document.getElementById('pctLabel').textContent = p + ' of ' + TOTAL + ' present';

  const sorted = [...present].sort((a, b) => a - b);
  const allAbsent = [];
  for (let i = 1; i <= TOTAL; i++) if (!present.has(i)) allAbsent.push(i);

  const pc = document.getElementById('presentChips');
  pc.innerHTML = sorted.length
    ? sorted.map(r => `<span class="chip">${r}</span>`).join('')
    : '<span class="empty-note">None marked yet</span>';

  const ac = document.getElementById('absentChips');
  ac.innerHTML = allAbsent.length
    ? allAbsent.slice(0, 24).map(r => `<span class="chip absent">${r}</span>`).join('')
      + (allAbsent.length > 24 ? `<span class="chip absent">+${allAbsent.length - 24}</span>` : '')
    : '<span class="empty-note">Full attendance!</span>';

  updateCopyText(sorted);
}

function updateCopyText(sorted) {
  const box = document.getElementById('copyTextBox');
  const btn = document.getElementById('copyBtn');
  if (!box || !btn) return;
  if (!sorted.length) {
    box.textContent = 'Mark attendance above to generate shareable text.';
    btn.textContent = 'Copy';
    btn.className = 'btn copy-btn';
    return;
  }
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  box.textContent = 'Attendance for MCA Sem 2 on ' + dateStr + ' is : ' + sorted.join(', ');
  btn.textContent = 'Copy';
  btn.className = 'btn copy-btn';
}

function copyText() {
  const box = document.getElementById('copyTextBox');
  const btn = document.getElementById('copyBtn');
  const text = box.textContent;
  if (!text || text === 'Mark attendance above to generate shareable text.') return;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      btn.className = 'btn copy-btn copied';
      btn.textContent = 'Copied!';
      setTimeout(() => {
        btn.className = 'btn copy-btn';
        btn.textContent = 'Copy';
      }, 2000);
    });
  } else {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    btn.className = 'btn copy-btn copied';
    btn.textContent = 'Copied!';
    setTimeout(() => {
      btn.className = 'btn copy-btn';
      btn.textContent = 'Copy';
    }, 2000);
  }
}

function saveSession() {
  if (present.size === 0) {
    alert('Mark at least one student as present first.');
    return;
  }
  const now = new Date();
  const label = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  const pct = Math.round(present.size / TOTAL * 100);
  sessions.push({ label, pct, present: [...present], date: now });
  renderHistory();
  document.getElementById('aiBox').innerHTML =
    '<span class="muted italic">Session saved. Tap "Analyse" for insights.</span>';
}

function renderHistory() {
  const list = document.getElementById('historyList');
  if (!sessions.length) {
    list.innerHTML = '<span class="empty-note">No sessions saved yet</span>';
    return;
  }
  list.innerHTML = sessions.slice().reverse().map(s => {
    const cls = s.pct >= 75 ? '' : s.pct >= 50 ? ' warn' : ' danger';
    return `<div class="history-item">
      <span class="history-date">${s.label}</span>
      <span class="history-pct${cls}">${s.pct}%</span>
    </div>`;
  }).join('');

  const chart = document.getElementById('barChart');
  const last5 = sessions.slice(-5);
  chart.innerHTML = last5.map(s => {
    const cls = s.pct >= 75 ? '' : s.pct >= 50 ? ' warn' : ' danger';
    return `<div class="bar-row">
      <span style="min-width:36px">${s.label}</span>
      <div class="bar-outer"><div class="bar-inner${cls}" style="width:${s.pct}%"></div></div>
      <span class="bar-val">${s.pct}%</span>
    </div>`;
  }).join('');
}

async function getAIInsight() {
  const p = present.size;
  const pct = Math.round(p / TOTAL * 100);
  const absent = [];
  for (let i = 1; i <= TOTAL; i++) if (!present.has(i)) absent.push(i);

  const histSummary = sessions.length
    ? sessions.map(s => `${s.label}: ${s.pct}%`).join(', ')
    : 'No previous sessions.';

  const box = document.getElementById('aiBox');
  box.innerHTML = '<span class="muted italic">Analysing...</span>';

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: `You are an AI assistant for a classroom attendance system.
Today: ${TOTAL} total students, ${p} present (${pct}%), absent rolls: ${absent.join(', ') || 'none'}.
History: ${histSummary}.
Give 2-3 concise practical insights or recommendations for the teacher.
Under 80 words. No bullet symbols. Write as short paragraphs.`
        }]
      })
    });

    const data = await res.json();
    const text = data.content?.find(b => b.type === 'text')?.text || 'No insight available.';
    box.innerHTML = `<span style="color:#2c3e50">${text}</span>`;
  } catch (e) {
    box.innerHTML = '<span class="muted italic">Could not fetch insight. Please try again.</span>';
  }
}
