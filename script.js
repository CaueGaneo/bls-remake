// =============================================
// SUPABASE
// =============================================
const SUPABASE_URL = "https://mvvktemmkzzmaqqgmnpo.supabase.co";
const SUPABASE_KEY = "sb_publishable_hN9NakLX5Vb27LmTuBcevg_rrd7it0p";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// =============================================
// AUTENTICAÇÃO
// =============================================
async function verificarSessao() {
    const { data } = await supabaseClient.auth.getSession();
    const user = data.session?.user;
    const authScreen = document.getElementById("auth-screen");
    const app = document.getElementById("app");
    const isPerfilPage = !!document.getElementById("tela-criacao");

    // Na página de perfil: sempre mostra o app (perfil é público)
    if (isPerfilPage) {
        if (authScreen) authScreen.style.display = "none";
        if (app) app.classList.remove("hidden");
        await carregarPlayers();
        await carregarPerfilPagina();
        atualizarBotoesAuth(user);
        return;
    }

    // Nas outras páginas (ranking etc.): mantém o login obrigatório
    if (user) {
        if (authScreen) authScreen.style.display = "none";
        if (app) app.classList.remove("hidden");
        await carregarPlayers();
        atualizarBotoesAuth(user);
    } else {
        if (authScreen) authScreen.style.display = "flex";
        if (app) app.classList.add("hidden");
        atualizarBotoesAuth(null);
    }
}

function atualizarBotoesAuth(user) {
    const btnLogout = document.getElementById("btn-logout");
    const btnLogin = document.getElementById("btn-login");
    if (btnLogout) btnLogout.style.display = user ? "inline-block" : "none";
    if (btnLogin) btnLogin.style.display = user ? "none" : "inline-block";
}
// =============================================
// DADOS PADRÃO
// =============================================
const playersPadrao = [
    { nome: "Cauê", rp: 453 },
    { nome: "João", rp: 423 },
    { nome: "Lorex", rp: 331 },
    { nome: "Davi", rp: 170 },
    { nome: "Enzo", rp: 157 },
    { nome: "Mickey", rp: 156 },
    { nome: "Rafa", rp: 6 }
];

let players = [];

// Calcula a classificação pelo RP
function getClassificacao(rp) {
    if (rp >= 4200) return { texto: "👑 Lendário", classe: "lendario" };
    if (rp >= 3150) return { texto: "🟢 Esmeralda", classe: "esmeralda" };
    if (rp >= 2300) return { texto: "🔹 Safira", classe: "safira" };
    if (rp >= 1650) return { texto: "💎 Diamante", classe: "diamante" };
    if (rp >= 1150) return { texto: "🔷 Platina", classe: "platina" };
    if (rp >= 750)  return { texto: "🟡 Ouro", classe: "ouro" };
    if (rp >= 450)  return { texto: "🥈 Prata", classe: "prata" };
    if (rp >= 250)  return { texto: "⚪ Ferro", classe: "ferro" };
    if (rp >= 100)  return { texto: "🟠 Cobre", classe: "cobre" };
    return { texto: "🟤 Bronze", classe: "bronze-class" };
}

// Carrega os players do Supabase
async function carregarPlayers() {
    const { data, error } = await supabaseClient
        .from("players")
        .select("*")
        .order("rp", { ascending: false });

    if (error) {
        console.error("Erro ao carregar:", error);
        alert("Erro ao carregar o ranking: " + error.message);
        return;
    }

    if (!data || data.length === 0) {
        const { error: insertError } = await supabaseClient
            .from("players")
            .insert(playersPadrao);

        if (insertError) {
            console.error("Erro ao inserir dados iniciais:", insertError);
            alert("Erro ao criar ranking inicial: " + insertError.message);
            return;
        }

        return carregarPlayers();
    }

    players = data;
    renderizarTabela();
}

// Desenha a tabela na tela
function renderizarTabela() {
    players.sort((a, b) => b.rp - a.rp);

    const tbody = document.getElementById("ranking-body");
    if (!tbody) return;

    tbody.innerHTML = "";

    players.forEach((player, index) => {
        const posicao = index + 1;
        const classificacao = getClassificacao(player.rp);

        let rankClass = "";
        if (posicao === 1) rankClass = "gold";
        else if (posicao === 2) rankClass = "silver";
        else if (posicao === 3) rankClass = "bronze";

        const tr = document.createElement("tr");
        if (posicao <= 3) tr.classList.add(`rank-${posicao}`);

        tr.innerHTML = `
            <td><span class="rank-badge ${rankClass}">${posicao}</span></td>
            <td class="blader-name">
                <span class="nome-texto">${player.nome}</span>
                <input class="edit-input nome admin-only" type="text" value="${player.nome}" data-id="${player.id}">
            </td>
            <td><span class="class-badge ${classificacao.classe}">${classificacao.texto}</span></td>
            <td class="rp">
                <span class="rp-texto">${player.rp}</span>
                <input class="edit-input admin-only" type="number" value="${player.rp}" data-id="${player.id}">
            </td>
            <td class="admin-only">
                <button class="btn-acao btn-excluir" onclick="excluirPlayer(${player.id}, '${player.nome}')">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Modo ADM
function entrarAdmin() {
    const senha = prompt("Digite a senha de Administrador:");
    if (senha === "ADM2008") {
        document.body.classList.add("admin-mode");
        alert("Modo Administrador ativado!");
        if (document.getElementById("tela-criacao")) carregarPerfilPagina();
    } else if (senha !== null) {
        alert("Senha incorreta!");
    }
}

function sairAdmin() {
    document.body.classList.remove("admin-mode");
}

async function adicionarPlayer() {
    const nome = prompt("Nome do novo player:");
    if (!nome) return;

    const rp = prompt("RP inicial do player:", "0");
    if (rp === null) return;

    const { error } = await supabaseClient
        .from("players")
        .insert([{ nome: nome.trim(), rp: Number(rp) || 0 }]);

    if (error) {
        alert("Erro ao adicionar player: " + error.message);
    } else {
        alert("Player adicionado com sucesso!");
        carregarPlayers();
    }
}

async function excluirPlayer(id, nome) {
    if (!confirm(`Tem certeza que deseja excluir ${nome}?`)) return;

    const { error } = await supabaseClient
        .from("players")
        .delete()
        .eq("id", id);

    if (error) {
        alert("Erro ao excluir: " + error.message);
    } else {
        carregarPlayers();
    }
}

async function salvarTudo() {
    const inputsNome = document.querySelectorAll(".edit-input.nome");
    const inputsRP = document.querySelectorAll(".edit-input[type='number']");

    for (const input of inputsNome) {
        const id = input.dataset.id;
        const novoNome = input.value.trim();
        if (novoNome) {
            await supabaseClient.from("players").update({ nome: novoNome }).eq("id", id);
        }
    }

    for (const input of inputsRP) {
        const id = input.dataset.id;
        const novoRP = Number(input.value) || 0;
        await supabaseClient.from("players").update({ rp: novoRP }).eq("id", id);
    }

    alert("Alterações salvas com sucesso!");
    carregarPlayers();
}

// =====================================================
// PERFIL COMPLETO (perfil.html)
// =====================================================

let meuPerfil = null;
let perfilAtualId = null;

async function carregarPerfilPagina() {
    const { data: sessionData } = await supabaseClient.auth.getSession();
    const usuarioAtual = sessionData.session?.user;
    if (!usuarioAtual) return;

    const params = new URLSearchParams(window.location.search);
    const idParam = params.get("id");

    let player = null;

    if (idParam) {
        const { data } = await supabaseClient.from("players").select("*").eq("id", idParam).maybeSingle();
        player = data;
    } else {
        const { data } = await supabaseClient.from("players").select("*").eq("user_id", usuarioAtual.id).maybeSingle();
        player = data;
    }

    if (document.body.classList.contains("admin-mode")) {
        carregarSeletorAdmPerfil(player?.id);
    }

    const telaCriacao = document.getElementById("tela-criacao");
    const telaPerfil = document.getElementById("tela-perfil");

    if (!player) {
        telaCriacao.classList.remove("hidden");
        telaPerfil.classList.add("hidden");
        return;
    }

    meuPerfil = player;
    perfilAtualId = player.id;
    telaCriacao.classList.add("hidden");
    telaPerfil.classList.remove("hidden");
    renderizarPerfilCompleto(player);

    const souDono = player.user_id === usuarioAtual.id;
    document.getElementById("edicao-basica").style.display = souDono ? "block" : "none";
}

async function carregarSeletorAdmPerfil(selectedId) {
    const { data } = await supabaseClient.from("players").select("id,nome").order("nome");
    const select = document.getElementById("admin-select-player");
    if (!select) return;
    select.innerHTML = (data || []).map(p => `<option value="${p.id}">${p.nome}</option>`).join("");
    if (selectedId) select.value = selectedId;
    select.onchange = () => { window.location.href = `perfil.html?id=${select.value}`; };
}

function rankPositionOf(id) {
    const idx = players.findIndex(pl => pl.id === id);
    return idx === -1 ? null : idx + 1;
}

function renderizarPerfilCompleto(p) {
    const classe = getClassificacao(p.rp || 0);
    document.getElementById("profile-classificacao").textContent = classe.texto;
    document.getElementById("profile-display-name").textContent = p.nome;
    document.getElementById("profile-favorite-line").textContent = p.bey_favorito ? `Bey favorito: ${p.bey_favorito}` : "";
    document.getElementById("profile-bio-line").textContent = p.bio || "";

    const avatarBox = document.getElementById("profile-avatar-preview");
    const initials = document.getElementById("profile-avatar-initials");
    if (p.avatar_url) {
        avatarBox.style.backgroundImage = `url(${p.avatar_url})`;
        avatarBox.classList.add("has-image");
        initials.style.display = "none";
    } else {
        avatarBox.style.backgroundImage = "";
        avatarBox.classList.remove("has-image");
        initials.style.display = "block";
        initials.textContent = (p.nome || "?")[0].toUpperCase();
    }

    document.getElementById("stat-ranking").textContent = "#" + (rankPositionOf(p.id) ?? "-");
    document.getElementById("stat-rp").textContent = p.rp ?? 0;
    document.getElementById("stat-vitorias").textContent = p.vitorias ?? 0;
    document.getElementById("stat-derrotas").textContent = p.derrotas ?? 0;
    const v = p.vitorias || 0, d = p.derrotas || 0;
    document.getElementById("stat-taxa").textContent = (v + d) === 0 ? "0%" : Math.round((v / (v + d)) * 100) + "%";

    const atr = p.atributos || { ataque: 50, defesa: 50, resistencia: 50 };
    document.getElementById("barras-atributos").innerHTML =
        barraHtml("Ataque", atr.ataque, "attack") +
        barraHtml("Defesa", atr.defesa, "defense") +
        barraHtml("Resistência", atr.resistencia, "stamina");

    document.getElementById("lista-fortes").innerHTML =
        (p.pontos_fortes || []).map(x => `<li>${escapeHTML(x)}</li>`).join("") ||
        '<li class="empty-hint">Ainda sem avaliação</li>';
    document.getElementById("lista-melhorar").innerHTML =
        (p.pontos_melhorar || []).map(x => `<li>${escapeHTML(x)}</li>`).join("") ||
        '<li class="empty-hint">Ainda sem avaliação</li>';
    document.getElementById("comentario-tecnico").textContent =
        p.comentario_tecnico ? `"${p.comentario_tecnico}"` : "Ainda sem comentário técnico do ADM.";

    document.getElementById("lista-momentos").innerHTML =
        (p.melhores_momentos || []).map(m => `
            <div class="momento-item">
                <h4>🏆 ${escapeHTML(m.titulo)}</h4>
                <div class="video-embed"><video src="${m.url}" controls></video></div>
                <p class="video-caption">${escapeHTML(m.legenda || "")}</p>
            </div>
        `).join("") || '<p class="empty-hint">Nenhum momento adicionado ainda.</p>';

    document.getElementById("lista-conquistas").innerHTML =
        (p.conquistas || []).map(c => `<span class="badge">🏆 ${escapeHTML(c)}</span>`).join("") ||
        '<p class="empty-hint">Nenhuma conquista ainda.</p>';

    document.getElementById("timeline-historico").innerHTML =
        (p.historico || []).slice().reverse().map(h => `
            <div class="entry">
                <div class="date">${new Date(h.data).toLocaleDateString("pt-BR")}</div>
                <div class="desc">${escapeHTML(h.descricao)}</div>
            </div>
        `).join("") || '<p class="empty-hint">Sem histórico ainda.</p>';

    document.getElementById("profile-favorite-bey").value = p.bey_favorito || "";
    document.getElementById("profile-avatar-url").value = p.avatar_url || "";
    document.getElementById("profile-accent-color").value = p.accent_color || "#00b4ff";
    document.getElementById("profile-bio").value = p.bio || "";

    if (document.body.classList.contains("admin-mode")) {
        document.getElementById("adm-vitorias").value = p.vitorias ?? 0;
        document.getElementById("adm-derrotas").value = p.derrotas ?? 0;
        document.getElementById("adm-fortes").value = (p.pontos_fortes || []).join("\n");
        document.getElementById("adm-melhorar").value = (p.pontos_melhorar || []).join("\n");
        document.getElementById("adm-comentario").value = p.comentario_tecnico || "";
        document.getElementById("adm-ataque").value = atr.ataque;
        document.getElementById("adm-defesa").value = atr.defesa;
        document.getElementById("adm-resistencia").value = atr.resistencia;
    }
}

function barraHtml(nome, pct, classe) {
    pct = pct ?? 0;
    return `<div class="bar-row">
        <div class="name">${nome}</div>
        <div class="bar-track"><div class="bar-fill ${classe}" style="width:${pct}%"></div></div>
        <div class="pct">${pct}%</div>
    </div>`;
}

function escapeHTML(s) {
    return (s || "").toString().replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

async function criarMeuPerfil() {
    const nome = document.getElementById("criar-nome").value.trim();
    const feedback = document.getElementById("profile-feedback");
    if (!nome) { feedback.textContent = "Digite seu nome."; return; }

    const { data: sessionData } = await supabaseClient.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) return;

    const { error } = await supabaseClient.from("players").insert([{
        nome,
        rp: 0,
        user_id: user.id,
        bey_favorito: document.getElementById("criar-bey").value.trim(),
        estilo_batalha: document.getElementById("criar-estilo").value,
        avatar_url: document.getElementById("criar-avatar").value.trim(),
        bio: document.getElementById("criar-bio").value.trim()
    }]);

    if (error) { feedback.textContent = "Erro: " + error.message; return; }
    window.location.href = "perfil.html";
}

async function salvarPerfil() {
    if (!meuPerfil) return;
    const feedback = document.getElementById("profile-feedback2");

    const { error } = await supabaseClient.from("players").update({
        bey_favorito: document.getElementById("profile-favorite-bey").value.trim(),
        avatar_url: document.getElementById("profile-avatar-url").value.trim(),
        accent_color: document.getElementById("profile-accent-color").value,
        bio: document.getElementById("profile-bio").value.trim()
    }).eq("id", meuPerfil.id);

    if (error) { feedback.textContent = "Erro: " + error.message; return; }
    feedback.textContent = "Perfil salvo!";
    carregarPerfilPagina();
}

async function salvarAnaliseAdm() {
    if (!perfilAtualId) return;
    const pontosFortes = document.getElementById("adm-fortes").value.split("\n").map(s => s.trim()).filter(Boolean);
    const pontosMelhorar = document.getElementById("adm-melhorar").value.split("\n").map(s => s.trim()).filter(Boolean);

    const { error } = await supabaseClient.from("players").update({
        vitorias: Number(document.getElementById("adm-vitorias").value) || 0,
        derrotas: Number(document.getElementById("adm-derrotas").value) || 0,
        pontos_fortes: pontosFortes,
        pontos_melhorar: pontosMelhorar,
        comentario_tecnico: document.getElementById("adm-comentario").value,
        atributos: {
            ataque: Number(document.getElementById("adm-ataque").value) || 0,
            defesa: Number(document.getElementById("adm-defesa").value) || 0,
            resistencia: Number(document.getElementById("adm-resistencia").value) || 0
        }
    }).eq("id", perfilAtualId);

    if (error) { alert("Erro: " + error.message); return; }
    alert("Análise salva!");
    carregarPerfilPagina();
}

async function admAdicionarConquista() {
    const nome = document.getElementById("adm-nova-conquista").value.trim();
    if (!nome || !perfilAtualId) return;
    const novas = [...(meuPerfil.conquistas || []), nome];
    const { error } = await supabaseClient.from("players").update({ conquistas: novas }).eq("id", perfilAtualId);
    if (error) { alert("Erro: " + error.message); return; }
    document.getElementById("adm-nova-conquista").value = "";
    carregarPerfilPagina();
}

async function admAdicionarHistorico() {
    const desc = document.getElementById("adm-historico-desc").value.trim();
    if (!desc || !perfilAtualId) return;
    const novos = [...(meuPerfil.historico || []), { data: new Date().toISOString(), descricao: desc }];
    const { error } = await supabaseClient.from("players").update({ historico: novos }).eq("id", perfilAtualId);
    if (error) { alert("Erro: " + error.message); return; }
    document.getElementById("adm-historico-desc").value = "";
    carregarPerfilPagina();
}

async function admAdicionarMomento() {
    const titulo = document.getElementById("adm-momento-titulo").value.trim();
    const url = document.getElementById("adm-momento-url").value.trim();
    const legenda = document.getElementById("adm-momento-legenda").value.trim();
    if (!titulo || !url || !perfilAtualId) { alert("Preencha título e URL do vídeo."); return; }
    const novos = [...(meuPerfil.melhores_momentos || []), { titulo, url, legenda }];
    const { error } = await supabaseClient.from("players").update({ melhores_momentos: novos }).eq("id", perfilAtualId);
    if (error) { alert("Erro: " + error.message); return; }
    document.getElementById("adm-momento-titulo").value = "";
    document.getElementById("adm-momento-url").value = "";
    document.getElementById("adm-momento-legenda").value = "";
    carregarPerfilPagina();
}
