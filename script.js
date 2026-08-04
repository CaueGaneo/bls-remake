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

    if (user) {
        if (authScreen) authScreen.style.display = "none";
        if (app) app.classList.remove("hidden");
        await carregarPlayers();
        if (document.getElementById("tela-criacao")) {
            carregarPerfilPagina();
        }
    } else {
        if (authScreen) authScreen.style.display = "flex";
        if (app) app.classList.add("hidden");
    }
}

async function login() {
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value.trim();
    const erro = document.getElementById("auth-erro");

    const { error } = await supabaseClient.auth.signInWithPassword({
        email,
        password: senha
    });

    if (error) {
        if (erro) erro.textContent = error.message;
        return;
    }

    if (erro) erro.textContent = "";
    verificarSessao();
}

async function registrar() {
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value.trim();
    const erro = document.getElementById("auth-erro");

    const { error } = await supabaseClient.auth.signUp({
        email,
        password: senha
    });

    if (error) {
        if (erro) erro.textContent = error.message;
        return;
    }

    if (erro) erro.textContent = "Conta criada. Verifique o e-mail se a confirmação estiver ativa.";
}

async function logout() {
    await supabaseClient.auth.signOut();

    const authScreen = document.getElementById("auth-screen");
    const app = document.getElementById("app");

    if (authScreen) authScreen.style.display = "flex";
    if (app) app.classList.add("hidden");

    const email = document.getElementById("email");
    const senha = document.getElementById("senha");
    const erro = document.getElementById("auth-erro");

    if (email) email.value = "";
    if (senha) senha.value = "";
    if (erro) erro.textContent = "";
}

document.addEventListener("DOMContentLoaded", () => {
    const senha = document.getElementById("senha");
    if (senha) {
        senha.addEventListener("keydown", (e) => {
            if (e.key === "Enter") login();
        });
    }

    verificarSessao();
});

// Ajuda quando você volta pelo botão do navegador e o site é restaurado do cache
window.addEventListener("pageshow", () => {
    verificarSessao();
});

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
// PERFIL COMPLETO — só ADM edita
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
        carregarSelectVincular();
        return;
    }

    meuPerfil = player;
    perfilAtualId = player.id;
    telaCriacao.classList.add("hidden");
    telaPerfil.classList.remove("hidden");
    renderizarPerfilCompleto(player);
}

async function carregarSelectVincular() {
    const select = document.getElementById("vincular-player");
    if (!select) return;
    const { data } = await supabaseClient
        .from("players")
        .select("id, nome, rp")
        .is("user_id", null)
        .order("nome");
    if (!data || data.length === 0) {
        select.innerHTML = '<option value="">Nenhum perfil livre</option>';
        return;
    }
    select.innerHTML = '<option value="">Selecione seu nome...</option>' +
        data.map(p => `<option value="${p.id}">${p.nome} (${p.rp} RP)</option>`).join("");
}

async function vincularMeuPerfil() {
    const select = document.getElementById("vincular-player");
    const feedback = document.getElementById("profile-feedback");
    const playerId = select?.value;
    if (!playerId) {
        if (feedback) feedback.textContent = "Selecione seu nome.";
        return;
    }
    const { data: sessionData } = await supabaseClient.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) return;

    const { data: player } = await supabaseClient.from("players").select("id,user_id").eq("id", playerId).maybeSingle();
    if (!player || player.user_id) {
        if (feedback) feedback.textContent = "Perfil indisponível.";
        return;
    }

    const { error } = await supabaseClient
        .from("players")
        .update({ user_id: user.id })
        .eq("id", playerId)
        .is("user_id", null);

    if (error) {
        if (feedback) feedback.textContent = "Erro: " + error.message;
        return;
    }
    window.location.href = "perfil.html";
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

function escapeHTML(s) {
    return (s || "").toString().replace(/[&<>"']/g, c =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );
}

function barraHtml(nome, pct, classe) {
    pct = pct ?? 0;
    return `<div class="bar-row">
        <div class="name">${nome}</div>
        <div class="bar-track"><div class="bar-fill ${classe}" style="width:${pct}%"></div></div>
        <div class="pct">${pct}%</div>
    </div>`;
}

function renderizarPerfilCompleto(p) {
    const classe = getClassificacao(p.rp || 0);
    document.getElementById("profile-classificacao").textContent = classe.texto;
    document.getElementById("profile-display-name").textContent = p.nome || "Blader";
    document.getElementById("profile-equipe").textContent = p.equipe ? `Equipe: ${p.equipe}` : "";
    document.getElementById("profile-cidade").textContent = p.cidade ? `📍 ${p.cidade}` : "";
    document.getElementById("profile-entrada").textContent = p.data_entrada
        ? `Entrada: ${new Date(p.data_entrada + "T00:00:00").toLocaleDateString("pt-BR")}` : "";
    document.getElementById("profile-favorite-line").textContent = p.bey_favorito ? `Bey: ${p.bey_favorito}` : "";
    document.getElementById("profile-estilo-line").textContent = p.estilo_batalha ? `Estilo: ${p.estilo_batalha}` : "";
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

    const v = p.vitorias || 0, d = p.derrotas || 0, e = p.empates || 0;
    const total = v + d + e;
    document.getElementById("stat-ranking").textContent = "#" + (rankPositionOf(p.id) ?? "-");
    document.getElementById("stat-rp").textContent = p.rp ?? 0;
    document.getElementById("stat-vitorias").textContent = v;
    document.getElementById("stat-derrotas").textContent = d;
    document.getElementById("stat-empates").textContent = e;
    document.getElementById("stat-taxa").textContent = total === 0 ? "0%" : Math.round((v / total) * 100) + "%";
    document.getElementById("stat-partidas").textContent = total;
    document.getElementById("stat-campeonatos").textContent = p.campeonatos ?? 0;
    document.getElementById("stat-titulos").textContent = p.titulos ?? 0;

    const atr = p.atributos || {};
    document.getElementById("barras-atributos").innerHTML =
        barraHtml("Ataque", atr.ataque ?? 0, "attack") +
        barraHtml("Defesa", atr.defesa ?? 0, "defense") +
        barraHtml("Resistência", atr.resistencia ?? 0, "stamina") +
        barraHtml("Controle", atr.controle ?? 0, "attack") +
        barraHtml("Estratégia", atr.estrategia ?? 0, "defense") +
        barraHtml("Criatividade", atr.criatividade ?? 0, "stamina") +
        barraHtml("Consistência", atr.consistencia ?? 0, "attack");

    document.getElementById("lista-fortes").innerHTML =
        (p.pontos_fortes || []).map(x => `<li>${escapeHTML(x)}</li>`).join("") ||
        '<li class="empty-hint">Ainda sem avaliação</li>';
    document.getElementById("lista-melhorar").innerHTML =
        (p.pontos_melhorar || []).map(x => `<li>${escapeHTML(x)}</li>`).join("") ||
        '<li class="empty-hint">Ainda sem avaliação</li>';
    document.getElementById("comentario-tecnico").textContent =
        p.comentario_tecnico || "Ainda sem relatório técnico do ADM.";

    document.getElementById("lista-conquistas").innerHTML =
        (p.conquistas || []).map(c => `<span class="badge">🏆 ${escapeHTML(c)}</span>`).join("") ||
        '<p class="empty-hint">Nenhuma conquista ainda.</p>';

    document.getElementById("lista-momentos").innerHTML =
        (p.melhores_momentos || []).map(m => `
            <div class="momento-item">
                <h4>🏆 ${escapeHTML(m.titulo)}</h4>
                <div class="video-embed"><video src="${m.url}" controls></video></div>
                <p class="video-caption">${escapeHTML(m.legenda || "")}</p>
            </div>`).join("") || '<p class="empty-hint">Nenhuma jogada ainda.</p>';

    document.getElementById("lista-galeria").innerHTML =
        (p.galeria || []).map(g => `
            <div style="width:140px;text-align:center;">
                <img src="${escapeHTML(g.url)}" alt="" style="width:100%;border-radius:10px;border:1px solid #1e293b;">
                <p style="font-size:0.75rem;color:#a0aec0;margin-top:4px;">${escapeHTML(g.legenda || "")}</p>
            </div>`).join("") || '<p class="empty-hint">Galeria vazia.</p>';

    document.getElementById("timeline-evolucao").innerHTML =
        (p.evolucao || []).slice().reverse().map(h => `
            <div class="entry">
                <div class="date">${h.data ? new Date(h.data + "T00:00:00").toLocaleDateString("pt-BR") : ""}</div>
                <div class="desc">#${h.ranking} · ${h.rp} RP</div>
            </div>`).join("") || '<p class="empty-hint">Sem evolução registrada.</p>';

    document.getElementById("timeline-competicoes").innerHTML =
        (p.historico_competicoes || []).slice().reverse().map(h => `
            <div class="entry">
                <div class="date">${h.data ? new Date(h.data + "T00:00:00").toLocaleDateString("pt-BR") : ""}</div>
                <div class="desc"><strong>${escapeHTML(h.campeonato)}</strong> — ${escapeHTML(h.colocacao || "")}
                ${h.pontos ? ` · ${escapeHTML(String(h.pontos))} pts` : ""}
                ${h.destaque ? `<br><span style="color:#a0aec0">${escapeHTML(h.destaque)}</span>` : ""}</div>
            </div>`).join("") || '<p class="empty-hint">Sem competições.</p>';

    document.getElementById("timeline-partidas").innerHTML =
        (p.historico_partidas || []).slice().reverse().map(h => `
            <div class="entry">
                <div class="date">${h.data ? new Date(h.data + "T00:00:00").toLocaleDateString("pt-BR") : ""}</div>
                <div class="desc">vs ${escapeHTML(h.adversario)} — <strong>${escapeHTML(h.resultado)}</strong>
                (${escapeHTML(h.tipo || "")}) · ${escapeHTML(h.bey || "")}</div>
            </div>`).join("") || '<p class="empty-hint">Sem partidas.</p>';

    // Preenche painel ADM
    if (document.body.classList.contains("admin-mode")) {
        document.getElementById("adm-nome").value = p.nome || "";
        document.getElementById("adm-equipe").value = p.equipe || "";
        document.getElementById("adm-cidade").value = p.cidade || "";
        document.getElementById("adm-entrada").value = p.data_entrada || "";
        document.getElementById("adm-bey").value = p.bey_favorito || "";
        document.getElementById("adm-estilo").value = p.estilo_batalha || "";
        document.getElementById("adm-avatar").value = p.avatar_url || "";
        document.getElementById("adm-rp").value = p.rp ?? 0;
        document.getElementById("adm-bio").value = p.bio || "";
        document.getElementById("adm-vitorias").value = p.vitorias ?? 0;
        document.getElementById("adm-derrotas").value = p.derrotas ?? 0;
        document.getElementById("adm-empates").value = p.empates ?? 0;
        document.getElementById("adm-campeonatos").value = p.campeonatos ?? 0;
        document.getElementById("adm-titulos").value = p.titulos ?? 0;
        document.getElementById("adm-ataque").value = atr.ataque ?? 0;
        document.getElementById("adm-defesa").value = atr.defesa ?? 0;
        document.getElementById("adm-resistencia").value = atr.resistencia ?? 0;
        document.getElementById("adm-controle").value = atr.controle ?? 0;
        document.getElementById("adm-estrategia").value = atr.estrategia ?? 0;
        document.getElementById("adm-criatividade").value = atr.criatividade ?? 0;
        document.getElementById("adm-consistencia").value = atr.consistencia ?? 0;
        document.getElementById("adm-fortes").value = (p.pontos_fortes || []).join("\n");
        document.getElementById("adm-melhorar").value = (p.pontos_melhorar || []).join("\n");
        document.getElementById("adm-comentario").value = p.comentario_tecnico || "";
    }
}

async function salvarTudoAdm() {
    if (!perfilAtualId) return;
    const payload = {
        nome: document.getElementById("adm-nome").value.trim(),
        equipe: document.getElementById("adm-equipe").value.trim(),
        cidade: document.getElementById("adm-cidade").value.trim(),
        data_entrada: document.getElementById("adm-entrada").value || null,
        bey_favorito: document.getElementById("adm-bey").value.trim(),
        estilo_batalha: document.getElementById("adm-estilo").value,
        avatar_url: document.getElementById("adm-avatar").value.trim(),
        rp: Number(document.getElementById("adm-rp").value) || 0,
        bio: document.getElementById("adm-bio").value.trim(),
        vitorias: Number(document.getElementById("adm-vitorias").value) || 0,
        derrotas: Number(document.getElementById("adm-derrotas").value) || 0,
        empates: Number(document.getElementById("adm-empates").value) || 0,
        campeonatos: Number(document.getElementById("adm-campeonatos").value) || 0,
        titulos: Number(document.getElementById("adm-titulos").value) || 0,
        pontos_fortes: document.getElementById("adm-fortes").value.split("\n").map(s => s.trim()).filter(Boolean),
        pontos_melhorar: document.getElementById("adm-melhorar").value.split("\n").map(s => s.trim()).filter(Boolean),
        comentario_tecnico: document.getElementById("adm-comentario").value,
        atributos: {
            ataque: Number(document.getElementById("adm-ataque").value) || 0,
            defesa: Number(document.getElementById("adm-defesa").value) || 0,
            resistencia: Number(document.getElementById("adm-resistencia").value) || 0,
            controle: Number(document.getElementById("adm-controle").value) || 0,
            estrategia: Number(document.getElementById("adm-estrategia").value) || 0,
            criatividade: Number(document.getElementById("adm-criatividade").value) || 0,
            consistencia: Number(document.getElementById("adm-consistencia").value) || 0
        }
    };
    const { error } = await supabaseClient.from("players").update(payload).eq("id", perfilAtualId);
    if (error) { alert("Erro: " + error.message); return; }
    alert("Salvo!");
    carregarPlayers();
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

async function admAdicionarMomento() {
    const titulo = document.getElementById("adm-momento-titulo").value.trim();
    const url = document.getElementById("adm-momento-url").value.trim();
    const legenda = document.getElementById("adm-momento-legenda").value.trim();
    if (!titulo || !url || !perfilAtualId) { alert("Preencha título e URL."); return; }
    const novos = [...(meuPerfil.melhores_momentos || []), { titulo, url, legenda }];
    const { error } = await supabaseClient.from("players").update({ melhores_momentos: novos }).eq("id", perfilAtualId);
    if (error) { alert("Erro: " + error.message); return; }
    document.getElementById("adm-momento-titulo").value = "";
    document.getElementById("adm-momento-url").value = "";
    document.getElementById("adm-momento-legenda").value = "";
    carregarPerfilPagina();
}

async function admAdicionarGaleria() {
    const url = document.getElementById("adm-galeria-url").value.trim();
    const legenda = document.getElementById("adm-galeria-legenda").value.trim();
    if (!url || !perfilAtualId) return;
    const novos = [...(meuPerfil.galeria || []), { url, legenda }];
    const { error } = await supabaseClient.from("players").update({ galeria: novos }).eq("id", perfilAtualId);
    if (error) { alert("Erro: " + error.message); return; }
    document.getElementById("adm-galeria-url").value = "";
    document.getElementById("adm-galeria-legenda").value = "";
    carregarPerfilPagina();
}

async function admAdicionarEvolucao() {
    const data = document.getElementById("adm-evo-data").value;
    const ranking = Number(document.getElementById("adm-evo-rank").value) || 0;
    const rp = Number(document.getElementById("adm-evo-rp").value) || 0;
    if (!data || !perfilAtualId) return;
    const novos = [...(meuPerfil.evolucao || []), { data, ranking, rp }];
    const { error } = await supabaseClient.from("players").update({ evolucao: novos }).eq("id", perfilAtualId);
    if (error) { alert("Erro: " + error.message); return; }
    document.getElementById("adm-evo-data").value = "";
    document.getElementById("adm-evo-rank").value = "";
    document.getElementById("adm-evo-rp").value = "";
    carregarPerfilPagina();
}

async function admAdicionarCompeticao() {
    const campeonato = document.getElementById("adm-comp-nome").value.trim();
    if (!campeonato || !perfilAtualId) return;
    const item = {
        campeonato,
        data: document.getElementById("adm-comp-data").value || null,
        colocacao: document.getElementById("adm-comp-colocacao").value.trim(),
        pontos: document.getElementById("adm-comp-pontos").value.trim(),
        destaque: document.getElementById("adm-comp-destaque").value.trim()
    };
    const novos = [...(meuPerfil.historico_competicoes || []), item];
    const { error } = await supabaseClient.from("players").update({ historico_competicoes: novos }).eq("id", perfilAtualId);
    if (error) { alert("Erro: " + error.message); return; }
    ["adm-comp-nome","adm-comp-data","adm-comp-colocacao","adm-comp-pontos","adm-comp-destaque"].forEach(id => {
        document.getElementById(id).value = "";
    });
    carregarPerfilPagina();
}

async function admAdicionarPartida() {
    const adversario = document.getElementById("adm-partida-adv").value.trim();
    if (!adversario || !perfilAtualId) return;
    const item = {
        adversario,
        resultado: document.getElementById("adm-partida-resultado").value,
        tipo: document.getElementById("adm-partida-tipo").value,
        bey: document.getElementById("adm-partida-bey").value.trim(),
        data: document.getElementById("adm-partida-data").value || null
    };
    const novos = [...(meuPerfil.historico_partidas || []), item];
    const { error } = await supabaseClient.from("players").update({ historico_partidas: novos }).eq("id", perfilAtualId);
    if (error) { alert("Erro: " + error.message); return; }
    document.getElementById("adm-partida-adv").value = "";
    document.getElementById("adm-partida-bey").value = "";
    document.getElementById("adm-partida-data").value = "";
    carregarPerfilPagina();
}
