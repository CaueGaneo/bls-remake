document.addEventListener('DOMContentLoaded', () => {
  // ========== CONFIGURAÇÃO SUPABASE ==========
  // Substitua pelos dados do seu projeto Supabase
  const SUPABASE_URL = 'mvvktemmkzzmaqqgmnpo';
  const SUPABASE_ANON_KEY = 'sb_publishable_hN9NakLX5Vb27LmTuBcevg_rrd7it0p';

  // Senha do administrador
  const ADMIN_PASSWORD = 'beyblade';

  let supabaseClient = null;
  let isAdmin = false;
  let players = [];

  // ========== CLASSIFICAÇÕES ==========
  function getClassification(rp) {
    if (rp >= 5000) return { name: 'Lendário', color: '#ff4500' };
    if (rp >= 3500) return { name: 'Esmeralda', color: '#50c878' };
    if (rp >= 2500) return { name: 'Safira', color: '#0f52ba' };
    if (rp >= 1800) return { name: 'Diamante', color: '#b9f2ff' };
    if (rp >= 1200) return { name: 'Platina', color: '#e5e4e2' };
    if (rp >= 800)  return { name: 'Ouro', color: '#ffd700' };
    if (rp >= 500)  return { name: 'Prata', color: '#c0c0c0' };
    if (rp >= 300)  return { name: 'Ferro', color: '#a8a9ad' };
    if (rp >= 150)  return { name: 'Cobre', color: '#b87333' };
    return { name: 'Bronze', color: '#cd7f32' };
  }

  function getMedal(rank) {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '';
  }

  // ========== JOGADORES PADRÃO ==========
  const DEFAULT_PLAYERS = [
    { nome: 'Tyson', rp: 5200 },
    { nome: 'Kai', rp: 4850 },
    { nome: 'Max', rp: 3600 },
    { nome: 'Ray', rp: 3400 },
    { nome: 'Daichi', rp: 2700 },
    { nome: 'Hikaru', rp: 2100 },
    { nome: 'Brooklyn', rp: 1500 },
    { nome: 'Ryu', rp: 950 },
    { nome: 'Kenny', rp: 620 },
    { nome: 'Blader X', rp: 280 }
  ];

  // ========== INICIALIZAÇÃO DO SUPABASE (protegida) ==========
  function initSupabase() {
    try {
      if (!window.supabase || typeof window.supabase.createClient !== 'function') {
        // Alternativa: desestruturação (alguns builds UMD)
        if (window.supabase && typeof window.supabase.createClient === 'undefined') {
          const { createClient } = window.supabase;
          if (typeof createClient === 'function') {
            supabaseClient = createClient(mvvktemmkzzmaqqgmnpo, sb_publishable_hN9NakLX5Vb27LmTuBcevg_rrd7it0p);
            return true;
          }
        }
        throw new Error('SDK do Supabase não carregou. Verifique o CDN.');
      }
      supabaseClient = window.supabase.createClient(mvvktemmkzzmaqqgmnpo, sb_publishable_hN9NakLX5Vb27LmTuBcevg_rrd7it0p);
      return true;
    } catch (err) {
      const tbody = document.getElementById('players-body');
      if (tbody) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-msg">Erro ao conectar com o Supabase. O botão ADM ainda funciona.</td></tr>';
      }
      return false;
    }
  }

  // ========== SUPABASE ==========
  async function ensureDefaultPlayers() {
    if (!supabaseClient) return;

    const { data, error } = await supabaseClient
      .from('players')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Erro ao verificar tabela:', error.message);
      return;
    }

    if (!data || data.length === 0) {
      const { error: insertError } = await supabaseClient
        .from('players')
        .insert(DEFAULT_PLAYERS);

      if (insertError) {
        console.error('Erro ao inserir jogadores padrão:', insertError.message);
      }
    }
  }

  async function loadPlayers() {
    const tbody = document.getElementById('players-body');
    if (!tbody) return;

    if (!supabaseClient) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-msg">Supabase não configurado. Configure a URL e a chave no script.js</td></tr>';
      return;
    }

    tbody.innerHTML = '<tr><td colspan="5" class="loading-msg">Carregando ranking...</td></tr>';

    await ensureDefaultPlayers();

    const { data, error } = await supabaseClient
      .from('players')
      .select('id, nome, rp')
      .order('rp', { ascending: false });

    if (error) {
      console.error('Erro ao carregar jogadores:', error.message);
      tbody.innerHTML = '<tr><td colspan="5" class="empty-msg">Erro ao carregar dados. Verifique URL, chave e políticas RLS.</td></tr>';
      return;
    }

    players = data || [];
    renderTable();
  }

  async function addPlayer(nome, rp) {
    if (!supabaseClient) {
      alert('Supabase não está conectado.');
      return;
    }

    const { error } = await supabaseClient
      .from('players')
      .insert([{ nome, rp: Number(rp) }]);

    if (error) {
      alert('Erro ao adicionar jogador: ' + error.message);
      return;
    }
    await loadPlayers();
  }

  async function updatePlayer(id, nome, rp) {
    if (!supabaseClient) {
      alert('Supabase não está conectado.');
      return;
    }

    const { error } = await supabaseClient
      .from('players')
      .update({ nome, rp: Number(rp) })
      .eq('id', id);

    if (error) {
      alert('Erro ao atualizar jogador: ' + error.message);
      return;
    }
    await loadPlayers();
  }

  async function deletePlayer(id) {
    if (!supabaseClient) {
      alert('Supabase não está conectado.');
      return;
    }

    const { error } = await supabaseClient
      .from('players')
      .delete()
      .eq('id', id);

    if (error) {
      alert('Erro ao excluir jogador: ' + error.message);
      return;
    }
    await loadPlayers();
  }

  // ========== RENDER ==========
  function renderTable() {
    const tbody = document.getElementById('players-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (players.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-msg">Nenhum blader encontrado.</td></tr>';
      return;
    }

    players.forEach((player, index) => {
      const rank = index + 1;
      const medal = getMedal(rank);
      const classification = getClassification(player.rp);
      const rankClass = rank <= 3 ? `rank-${rank}` : '';

      const tr = document.createElement('tr');
      tr.dataset.id = player.id;

      // Ranking
      const tdRank = document.createElement('td');
      tdRank.className = `rank-cell ${rankClass}`;
      tdRank.textContent = medal ? `${medal} ${rank}` : String(rank);

      // Nome
      const tdNome = document.createElement('td');
      if (isAdmin) {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'edit-nome';
        input.value = player.nome;
        input.maxLength = 40;
        input.dataset.id = player.id;
        tdNome.appendChild(input);
      } else {
        tdNome.className = 'player-name';
        tdNome.textContent = player.nome;
      }

      // Classificação
      const tdClass = document.createElement('td');
      const badge = document.createElement('span');
      badge.className = 'class-badge';
      badge.textContent = classification.name;
      badge.style.color = classification.color;
      badge.style.borderColor = classification.color;
      tdClass.appendChild(badge);

      // RP
      const tdRp = document.createElement('td');
      if (isAdmin) {
        const input = document.createElement('input');
        input.type = 'number';
        input.className = 'edit-rp';
        input.value = player.rp;
        input.min = 0;
        input.max = 99999;
        input.dataset.id = player.id;
        tdRp.appendChild(input);
      } else {
        tdRp.className = 'rp-value';
        tdRp.textContent = player.rp.toLocaleString('pt-BR');
      }

      // Ações
      const tdActions = document.createElement('td');
      tdActions.className = 'admin-only actions-cell';
      if (isAdmin) {
        const btnSave = document.createElement('button');
        btnSave.type = 'button';
        btnSave.className = 'btn-save';
        btnSave.textContent = 'Salvar';
        btnSave.dataset.id = player.id;

        const btnDelete = document.createElement('button');
        btnDelete.type = 'button';
        btnDelete.className = 'btn-delete';
        btnDelete.textContent = 'Excluir';
        btnDelete.dataset.id = player.id;

        tdActions.appendChild(btnSave);
        tdActions.appendChild(btnDelete);
      }

      tr.appendChild(tdRank);
      tr.appendChild(tdNome);
      tr.appendChild(tdClass);
      tr.appendChild(tdRp);
      tr.appendChild(tdActions);
      tbody.appendChild(tr);
    });
  }

  // ========== ADMIN ==========
  function enableAdminMode() {
    isAdmin = true;
    document.body.classList.add('admin-mode');
    const panel = document.getElementById('admin-panel');
    if (panel) panel.classList.remove('hidden');
    renderTable();
  }

  function handleAdmClick() {
    if (isAdmin) {
      alert('Modo administrador já está ativo.');
      return;
    }

    const password = prompt('Digite a senha de administrador:');
    if (password === null) return;

    if (password === ADMIN_PASSWORD) {
      enableAdminMode();
    } else {
      alert('Senha incorreta!');
    }
  }

  function handleAddPlayer(event) {
    event.preventDefault();
    if (!isAdmin) return;

    const nomeInput = document.getElementById('new-nome');
    const rpInput = document.getElementById('new-rp');
    const nome = nomeInput.value.trim();
    const rp = Number(rpInput.value);

    if (!nome) {
      alert('Informe o nome do blader.');
      return;
    }
    if (isNaN(rp) || rp < 0) {
      alert('RP inválido.');
      return;
    }

    addPlayer(nome, rp).then(() => {
      nomeInput.value = '';
      rpInput.value = '';
    });
  }

  function handleTableClick(event) {
    if (!isAdmin) return;

    const target = event.target;
    const id = target.dataset.id;
    if (!id) return;

    if (target.classList.contains('btn-delete')) {
      const confirmed = confirm('Tem certeza que deseja excluir este blader?');
      if (confirmed) {
        deletePlayer(id);
      }
      return;
    }

    if (target.classList.contains('btn-save')) {
      const row = target.closest('tr');
      const nomeInput = row.querySelector('.edit-nome');
      const rpInput = row.querySelector('.edit-rp');
      const nome = nomeInput.value.trim();
      const rp = Number(rpInput.value);

      if (!nome) {
        alert('O nome não pode ficar vazio.');
        return;
      }
      if (isNaN(rp) || rp < 0) {
        alert('RP inválido.');
        return;
      }

      updatePlayer(id, nome, rp);
    }
  }

  // ========== EVENT LISTENERS (sempre registrados) ==========
  const admBtn = document.getElementById('adm-btn');
  if (admBtn) {
    admBtn.addEventListener('click', handleAdmClick);
  }

  const addForm = document.getElementById('add-player-form');
  if (addForm) {
    addForm.addEventListener('submit', handleAddPlayer);
  }

  const playersBody = document.getElementById('players-body');
  if (playersBody) {
    playersBody.addEventListener('click', handleTableClick);
  }

  // ========== INIT ==========
  initSupabase();
  loadPlayers();
});
