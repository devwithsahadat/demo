const API_BASE = 'http://localhost:5000/api';

async function rewriteContent() {
  const input = document.getElementById('inputText');
  if (!input) return;

  const loading = document.getElementById('loading');
  const output = document.getElementById('outputText');
  const meta = document.getElementById('meta');
  const mode = document.getElementById('mode').value;
  const language = document.getElementById('language').value;
  const keywords = document.getElementById('keywords').value.split(',').map((x) => x.trim()).filter(Boolean);

  loading?.classList.remove('hidden');
  const token = localStorage.getItem('token') || '';

  const response = await fetch(`${API_BASE}/rewrite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ text: input.value, mode, language, preserveKeywords: keywords }),
  });

  const data = await response.json();
  loading?.classList.add('hidden');

  if (!response.ok) {
    alert(data.message || 'Rewrite failed');
    return;
  }

  output.value = data.output;
  meta.textContent = `Similarity: ${data.similarity}% | Plagiarism-safe score: ${data.plagiarismSafeScore}%`;
}

async function loadHistory() {
  const table = document.querySelector('#historyTable tbody');
  if (!table) return;

  const token = localStorage.getItem('token') || '';
  const response = await fetch(`${API_BASE}/dashboard/history`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) return;
  const items = await response.json();
  table.innerHTML = items
    .map((x) => `<tr><td>${x.generated_title}</td><td>${x.mode}</td><td>${x.language}</td><td>${new Date(x.created_at).toLocaleString()}</td></tr>`)
    .join('');
}

function copyOutput() {
  const output = document.getElementById('outputText');
  if (output?.value) navigator.clipboard.writeText(output.value);
}

function downloadOutput() {
  const output = document.getElementById('outputText');
  const blob = new Blob([output.value || ''], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'rewritten-content.txt';
  a.click();
  URL.revokeObjectURL(url);
}

document.getElementById('rewriteBtn')?.addEventListener('click', rewriteContent);
document.getElementById('copyBtn')?.addEventListener('click', copyOutput);
document.getElementById('downloadBtn')?.addEventListener('click', downloadOutput);
loadHistory();
