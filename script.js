

const state = {
  expression: '',       
  justEvaled: false,    
  history: [],          
};



const exprEl         = document.getElementById('expression');
const resultEl       = document.getElementById('result');
const historyPanel   = document.getElementById('historyPanel');
const historyList    = document.getElementById('historyList');
const historyToggle  = document.getElementById('historyToggle');
const clearHistoryBtn = document.getElementById('clearHistory');
const datetimeEl     = document.getElementById('datetime');
const appEl          = document.getElementById('app');
const loaderEl       = document.getElementById('loader');



const SYMBOL_MAP = {
  '×': '*',
  '÷': '/',
  '−': '-',
};

function toMathExpr(str) {
  return str
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/%/g, '/100');  
}



function setResult(text, isError = false) {
  resultEl.textContent = text;
  resultEl.classList.toggle('error', isError);

  
  const len = String(text).length;
  resultEl.classList.remove('shrink', 'shrink-lg');
  if (len > 14) resultEl.classList.add('shrink-lg');
  else if (len > 9) resultEl.classList.add('shrink');
}

function setExpression(text) {
  exprEl.textContent = text;
}

function render() {
  setExpression(state.expression);
  if (!state.expression) {
    setResult('0');
  }
}


function livePreview() {
  if (!state.expression || state.justEvaled) return;

  const mathStr = toMathExpr(state.expression);
  try {
    
    if (/[\d).]$/.test(state.expression)) {
      
      const preview = Function('"use strict"; return (' + mathStr + ')')();
      if (isFinite(preview)) {
        setResult(formatResult(preview));
      }
    }
  } catch (e) {
    
  }
}



function formatResult(value) {
  
  const rounded = parseFloat(value.toPrecision(14));

  
  if (Number.isInteger(rounded)) return String(rounded);

  
  return parseFloat(rounded.toPrecision(10)).toString();
}



function isOperator(ch) {
  return ['+', '-', '×', '÷', '−'].includes(ch);
}


function endsWithOperator(expr) {
  return isOperator(expr.slice(-1));
}


function handleInput(value) {
  const isOp = isOperator(value);

  
  
  if (state.justEvaled) {
    if (isOp) {
      
      state.expression = resultEl.textContent + value;
    } else if (value === '.') {
      state.expression = '0.';
    } else {
      
      state.expression = value;
    }
    state.justEvaled = false;
    render();
    livePreview();
    return;
  }

  
  if (isOp && endsWithOperator(state.expression)) {
    state.expression = state.expression.slice(0, -1) + value;
    render();
    livePreview();
    return;
  }

  
  if (isOp && !state.expression && value !== '-') return;

  
  if (value === '.') {
    const parts = state.expression.split(/[+\-×÷]/);
    const lastPart = parts[parts.length - 1];
    if (lastPart.includes('.')) return;
    if (!lastPart) state.expression += '0';   
  }

  state.expression += value;
  render();
  livePreview();
}

function handleEquals() {
  if (!state.expression || endsWithOperator(state.expression)) return;

  const display = state.expression;
  const mathStr = toMathExpr(display);

  let result;
  try {
    
    result = Function('"use strict"; return (' + mathStr + ')')();
  } catch (e) {
    setResult('Syntax Error', true);
    state.expression = '';
    state.justEvaled = true;
    return;
  }

  if (!isFinite(result)) {
    setResult(result === Infinity ? '∞ (÷ by 0)' : 'Error', true);
    state.expression = '';
    state.justEvaled = true;
    return;
  }

  const formatted = formatResult(result);

  
  addHistory(display, formatted);

  
  setExpression(display + '  =');
  setResult(formatted);
  state.expression = '';
  state.justEvaled = true;
}


function handleClear() {
  state.expression = '';
  state.justEvaled = false;
  setExpression('');
  setResult('0');
}


function handleDelete() {
  if (state.justEvaled) {
    handleClear();
    return;
  }
  state.expression = state.expression.slice(0, -1);
  render();
  if (state.expression) livePreview();
  else setResult('0');
}



function addHistory(expr, result) {
  state.history.unshift({ expr, result });
  if (state.history.length > 10) state.history.pop();
  renderHistory();
}

function renderHistory() {
  if (!state.history.length) {
    historyList.innerHTML = '<li class="history__empty">No calculations yet</li>';
    return;
  }

  historyList.innerHTML = state.history
    .map((item, i) =>
      `<li class="history__item" role="listitem" data-index="${i}" tabindex="0" aria-label="Load ${item.expr} = ${item.result}">
        <span class="history__item-expr">${escHtml(item.expr)}</span>
        <span class="history__item-result">= ${escHtml(item.result)}</span>
      </li>`
    )
    .join('');

  
  historyList.querySelectorAll('.history__item').forEach(el => {
    el.addEventListener('click', () => {
      const index = parseInt(el.dataset.index, 10);
      recallHistory(index);
    });
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const index = parseInt(el.dataset.index, 10);
        recallHistory(index);
      }
    });
  });
}

function recallHistory(index) {
  const item = state.history[index];
  if (!item) return;
  state.expression = item.result;
  state.justEvaled = true;
  setExpression(item.expr + '  =');
  setResult(item.result);
}

function clearHistory() {
  state.history = [];
  renderHistory();
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}



document.querySelector('.calc__grid').addEventListener('click', e => {
  const btn = e.target.closest('.btn');
  if (!btn) return;

  
  spawnRipple(btn, e);

  const action = btn.dataset.action;
  const value  = btn.dataset.value;

  switch (action) {
    case 'input':   handleInput(value); break;
    case 'equals':  handleEquals();     break;
    case 'clear':   handleClear();      break;
    case 'delete':  handleDelete();     break;
  }
});

function spawnRipple(btn, e) {
  const rect   = btn.getBoundingClientRect();
  const size   = Math.max(rect.width, rect.height);
  const x      = e.clientX - rect.left  - size / 2;
  const y      = e.clientY - rect.top   - size / 2;

  const ripple = document.createElement('span');
  ripple.classList.add('btn__ripple');
  ripple.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px`;
  btn.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove());
}



const KEY_MAP = {
  '0':'0','1':'1','2':'2','3':'3','4':'4',
  '5':'5','6':'6','7':'7','8':'8','9':'9',
  '.':'.',
  '+':'+', '-':'-', '*':'×', '/':'÷', 'x':'×',
  '%':'%',
  'Enter':'=', '=':'=',
  'Backspace':'DEL',
  'Escape':'AC', 'Delete':'AC',
};

document.addEventListener('keydown', e => {
  const mapped = KEY_MAP[e.key];
  if (!mapped) return;

  e.preventDefault();

  
  highlightButton(mapped);

  if (mapped === '=')   { handleEquals(); return; }
  if (mapped === 'DEL') { handleDelete(); return; }
  if (mapped === 'AC')  { handleClear();  return; }
  handleInput(mapped);
});

function highlightButton(label) {
  
  let target;

  if (label === '=') {
    target = document.querySelector('[data-action="equals"]');
  } else if (label === 'DEL') {
    target = document.querySelector('[data-action="delete"]');
  } else if (label === 'AC') {
    target = document.querySelector('[data-action="clear"]');
  } else {
    target = document.querySelector(`[data-value="${CSS.escape(label)}"]`);
  }

  if (!target) return;
  target.classList.add('active');
  setTimeout(() => target.classList.remove('active'), 140);
}



historyToggle.addEventListener('click', () => {
  const expanded = historyToggle.getAttribute('aria-expanded') === 'true';
  historyToggle.setAttribute('aria-expanded', String(!expanded));

  if (expanded) {
    historyPanel.setAttribute('hidden', '');
  } else {
    historyPanel.removeAttribute('hidden');
  }
});

clearHistoryBtn.addEventListener('click', clearHistory);



function updateClock() {
  const now = new Date();
  const date = now.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric'
  });
  const time = now.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
  datetimeEl.textContent = `${date}\n${time}`;
}

updateClock();
setInterval(updateClock, 1000);



(function initParticles() {
  const canvas = document.getElementById('particles');
  const ctx    = canvas.getContext('2d');

  const COLORS = ['#4f8eff', '#a259ff', '#00d4ff', '#ffffff'];
  let W, H, particles;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function mkParticle() {
    return {
      x:     Math.random() * W,
      y:     Math.random() * H,
      r:     Math.random() * 1.5 + 0.3,
      vx:    (Math.random() - 0.5) * 0.3,
      vy:    (Math.random() - 0.5) * 0.3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      alpha: Math.random() * 0.5 + 0.1,
    };
  }

  function init() {
    resize();
    particles = Array.from({ length: 100 }, mkParticle);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.fill();

      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
    });

    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', () => { resize(); });

  init();
  draw();
})();



window.addEventListener('load', () => {
  setTimeout(() => {
    loaderEl.classList.add('hidden');
    appEl.classList.add('visible');
  }, 900);
});


render();