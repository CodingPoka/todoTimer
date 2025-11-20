(() => {
  const $ = s => document.querySelector(s);
  const views = { home: $('#home'), todo: $('#todo'), timer: $('#timer') };
  const navBtns = Array.from(document.querySelectorAll('.nav-btn'));

  function show(name){
    Object.keys(views).forEach(k => views[k].classList.add('hidden'));
    views[name].classList.remove('hidden');
    navBtns.forEach(b => b.classList.toggle('active', b.id === 'btn-'+name));
  }

  $('#btn-home').addEventListener('click', () => show('home'));
  $('#btn-todo').addEventListener('click', () => show('todo'));
  $('#btn-timer').addEventListener('click', () => show('timer'));

  // ---------------- Todo App ----------------
  const TODO_KEY = 'todoTimer_todos_v1';
  const todoForm = $('#todo-form');
  const todoInput = $('#todo-input');
  const todoList = $('#todo-list');

  let todos = JSON.parse(localStorage.getItem(TODO_KEY) || '[]');

  function save(){ localStorage.setItem(TODO_KEY, JSON.stringify(todos)); }

  function render(){
    todoList.innerHTML = '';
    if(todos.length === 0){
      const e = document.createElement('div'); e.textContent = 'No tasks yet.'; e.style.color = '#6b7280';
      todoList.appendChild(e); return;
    }
    todos.forEach((t, i) => {
      const li = document.createElement('li'); li.className = 'todo-item' + (t.done ? ' completed' : '');
      const cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = !!t.done;
      cb.addEventListener('change', () => { todos[i].done = cb.checked; save(); render(); });
      const txt = document.createElement('div'); txt.className = 'text'; txt.textContent = t.text;
      const edit = document.createElement('button'); edit.textContent = 'Edit';
      edit.addEventListener('click', () => {
        const v = prompt('Edit task', t.text);
        if(v != null){ todos[i].text = v.trim(); save(); render(); }
      });
      const del = document.createElement('button'); del.textContent = 'Delete';
      del.addEventListener('click', () => { if(confirm('Delete task?')){ todos.splice(i,1); save(); render(); } });

      li.appendChild(cb); li.appendChild(txt); li.appendChild(edit); li.appendChild(del);
      todoList.appendChild(li);
    });
  }

  todoForm.addEventListener('submit', (e) => {
    e.preventDefault(); const v = todoInput.value.trim(); if(!v) return; todos.unshift({text:v,done:false,created:Date.now()}); todoInput.value=''; save(); render();
  });

  render();

  // ---------------- Timer (millisecond-accurate, circular display) ----------------
  const display = $('#timer-display');
  const minutesInput = $('#timer-minutes');
  const startBtn = $('#start');
  const pauseBtn = $('#pause');
  const resetBtn = $('#reset');

  // remaining time in milliseconds
  let remainingMs = Math.max(0, parseInt(minutesInput.value || 25, 10)) * 60 * 1000;
  let running = false;
  let rafId = null;
  let endTime = null;

  function formatMs(ms){
    const total = Math.max(0, Math.floor(ms));
    const minutes = Math.floor(total / 60000);
    const seconds = Math.floor((total % 60000) / 1000);
    const msecs = total % 1000; // show three-digit milliseconds
    const mm = String(minutes).padStart(2, '0');
    const ss = String(seconds).padStart(2, '0');
    const msStr = String(msecs).padStart(3, '0');
    return `${mm}:${ss}:${msStr}`;
  }

  function updateDisplay(){ display.textContent = formatMs(remainingMs); }

  function loop(){
    const now = Date.now();
    remainingMs = Math.max(0, endTime - now);
    updateDisplay();
    if(remainingMs <= 0){ stop(); beep(); return; }
    rafId = requestAnimationFrame(loop);
  }

  function start(){
    if(running) return;
    endTime = Date.now() + remainingMs;
    running = true;
    rafId = requestAnimationFrame(loop);
  }

  function stop(){
    if(!running) return;
    running = false;
    if(rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }

  function pause(){
    if(!running) return;
    // calculate remaining and stop
    remainingMs = Math.max(0, endTime - Date.now());
    stop();
  }

  function reset(){
    stop();
    remainingMs = Math.max(0, parseInt(minutesInput.value || 25, 10)) * 60 * 1000;
    updateDisplay();
  }

  function beep(){
    try{
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = 880;
      g.gain.value = 0.06;
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      setTimeout(()=>{ o.stop(); ctx.close(); }, 700);
    }catch(e){ console.log('beep error', e); }
  }

  startBtn.addEventListener('click', () => { if(remainingMs <= 0) remainingMs = Math.max(0, parseInt(minutesInput.value || 25, 10)) * 60 * 1000; start(); });
  pauseBtn.addEventListener('click', () => { pause(); });
  resetBtn.addEventListener('click', () => { reset(); });
  minutesInput.addEventListener('change', () => { const m = Math.max(0, parseInt(minutesInput.value || 0, 10)); minutesInput.value = m; remainingMs = m * 60 * 1000; updateDisplay(); });

  updateDisplay();

  // expose for debugging
  window._todoTimer = { todos, save, render, start, stop, reset };

})();
