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

    const isPerfilSimples = !!document.getElementById("profile-nickname");
    const isPerfilCompleto = !!document.getElementById("tela-criacao");
    const isPerfilPage = isPerfilSimples || isPerfilCompleto;

    if (isPerfilPage) {
        if (user) {
            if (authScreen) authScreen.style.display = "none";
            if (app) app.classList.remove("hidden");
            await carregarPlayers();
            if (isPerfilSimples) await carregarPerfilSimples();
            if (isPerfilCompleto) await carregarPerfilPagina();
            atualizarBotoesAuth(user);
        } else {
            if (authScreen) authScreen.style.display = "flex";
            if (app) app.classList.add("hidden");
            atualizarBotoesAuth(null);
        }
        return;
    }

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

async function login() {
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value.trim();
    const erro = document.getElementById("auth-erro");
    const { error } = await supabaseClient.auth.signInWithPassword({
        email: email,
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
        email: email,
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
    document.body.classList.remove("admin-mode");
    const email = document.getElementById("email");
    const senha = document.getElementById("senha");
    const erro = document.getElementById("auth-erro");
    if (email) email.value = "";
    if (senha) senha.value = "";
    if (erro) erro.textContent = "";
}

document.addEventListener("DOMContentLoaded", function () {
    const senha = document.getElementById("senha");
    if (senha) {
        senha.addEventListener("keydown", function (e) {
            if (e.key === "Enter") login();
        });
    }
    verificarSessao();
});

window.addEventListener("pageshow", function () {
    verificarSessao();
});

// =============================================
// RANKING
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
let meuPerfil = null;
let perfilAtualId = null;

function getClassificacao(rp) {
    if (rp >= 4200) return { texto: "👑 Lendário", classe: "lendario" };
    if (rp >= 3150) return { texto: "🟢 Esmeralda", classe: "esmeralda" };
    if (rp >= 2300) return { texto: "🔹 Safira", classe: "safira" };
    if (rp >= 1650) return { texto: "💎 Diamante", classe: "diamante" };
    if (rp >= 1150) return { texto: "🔷 Platina", classe: "platina" };
    if (rp >= 750) return { texto: "🟡 Ouro", classe: "ouro" };
    if (rp >= 450) return { texto: "🥈 Prata", classe: "prata" };
    if (rp >= 250) return { texto: "⚪ Ferro", classe: "ferro" };
    if (rp >= 100) return { texto: "🟠 Cobre", classe: "cobre" };
    return { texto: "🟤 Bronze", classe: "bronze-class" };
}

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

function renderizarTabela() {
    players.sort(function (a, b) { return b.rp - a.rp; });
    const tbody = document.getElementById("ranking-body");
    if (!tbody) return;
    tbody.innerHTML = "";
    players.forEach(function (player, index) {
        const posicao = index + 1;
        const classificacao = getClassificacao(player.rp);
        let rankClass = "";
        if (posicao === 1) rankClass = "gold";
        else if (posicao === 2) rankClass = "silver";
        else if (posicao === 3) rankClass = "bronze";
        const tr = document.createElement("tr");
        if (posicao <= 3) tr.classList.add("rank-" + posicao);
        tr.innerHTML =
            '<td><span class="rank-badge ' + rankClass + '">' + posicao + "</span></td>" +
            '<td class="blader-name">' +
            '<span class="nome-texto">' + player.nome + "</span>" +
            '<input class="edit-input nome admin-only" type="text" value="' + player.nome + '" data-id="' + player.id + '">' +
            "</td>" +
            '<td><span class="class-badge ' + classificacao.classe + '">' + classificacao.texto + "</span></td>" +
            '<td class="rp">' +
            '<span class="rp-texto">' + player.rp + "</span>" +
            '<input class="edit-input admin-only" type="number" value="' + player.rp + '" data-id="' + player.id + '">' +
            "</td>" +
            '<td class="admin-only">' +
            '<button class="btn-acao btn-excluir" onclick="excluirPlayer(' + player.id + ", '" + player.nome + "')\">🗑️</button>" +
            "</td>";
        tbody.appendChild(tr);
    });
}

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
    if (!confirm("Tem certeza que deseja excluir " + nome + "?")) return;
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
// PERFIL SIMPLES
// =====================================================
async function carregarPerfilSimples() {
    const { data: sessionData } = await supabaseClient.auth.getSession();
    const user = sessionData.session && sessionData.session.user;
    if (!user) return;

    const emailEl = document.getElementById("profile-email");
    if (emailEl) emailEl.textContent = user.email || "";

    const { data: player, error } = await supabaseClient
        .from("players")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

    if (error) {
        console.error(error);
        const fb = document.getElementById("profile-feedback");
        if (fb) fb.textContent = "Erro ao carregar: " + error.message;
        return;
    }

    meuPerfil = player || null;

    const nome = (player && player.nome) || "";
    const bey = (player && player.bey_favorito) || "";
    const avatar = (player && player.avatar_url) || "";
    const accent = (player && player.accent_color) || "#00b4ff";
    const bio = (player && player.bio) || "";

    const nick = document.getElementById("profile-nickname");
    const beyInput = document.getElementById("profile-favorite-bey");
    const avatarInput = document.getElementById("profile-avatar-url");
    const colorInput = document.getElementById("profile-accent-color");
    const bioInput = document.getElementById("profile-bio");
    const displayName = document.getElementById("profile-display-name");
    const favLine = document.getElementById("profile-favorite-line");

    if (nick) nick.value = nome;
    if (beyInput) beyInput.value = bey;
    if (avatarInput) avatarInput.value = avatar;
    if (colorInput) colorInput.value = accent;
    if (bioInput) bioInput.value = bio;
    if (displayName) displayName.textContent = nome || "Blader";
    if (favLine) favLine.textContent = bey ? ("Bey favorito: " + bey) : "";

    const avatarBox = document.getElementById("profile-avatar-preview");
    const initials = document.getElementById("profile-avatar-initials");
    if (avatarBox && initials) {
        if (avatar) {
            avatarBox.style.backgroundImage = "url(" + avatar + ")";
            avatarBox.classList.add("has-image");
            initials.style.display = "none";
        } else {
            avatarBox.style.backgroundImage = "";
            avatarBox.classList.remove("has-image");
            initials.style.display = "block";
            initials.textContent = (nome || user.email || "?")[0].toUpperCase();
        }
    }

    document.documentElement.style.setProperty("--accent", accent);

    const fb = document.getElementById("profile-feedback");
    if (fb) fb.textContent = "";
}

async function salvarPerfil() {
    const feedback = document.getElementById("profile-feedback") || document.getElementById("profile-feedback2");
    const { data: sessionData } = await supabaseClient.auth.getSession();
    const user = sessionData.session && sessionData.session.user;
    if (!user) {
        if (feedback) feedback.textContent = "Faça login para salvar.";
        return;
    }

    const nickEl = document.getElementById("profile-nickname");
    if (nickEl) {
        const nome = nickEl.value.trim();
        const bey = (document.getElementById("profile-favorite-bey") && document.getElementById("profile-favorite-bey").value || "").trim();
        const avatar = (document.getElementById("profile-avatar-url") && document.getElementById("profile-avatar-url").value || "").trim();
        const colorEl = document.getElementById("profile-accent-color");
        const accent = (colorEl && colorEl.value) || "#00b4ff";
        const bio = (document.getElementById("profile-bio") && document.getElementById("profile-bio").value || "").trim();

        if (!nome) {
            if (feedback) feedback.textContent = "Digite um apelido.";
            return;
        }

        const { data: existente } = await supabaseClient
            .from("players")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle();

        let error = null;

        if (existente) {
            const result = await supabaseClient.from("players").update({
                nome: nome,
                bey_favorito: bey,
                avatar_url: avatar,
                accent_color: accent,
                bio: bio
            }).eq("id", existente.id);
            error = result.error;
        } else {
            const { data: porNome } = await supabaseClient
                .from("players")
                .select("id")
                .eq("nome", nome)
                .is("user_id", null)
                .maybeSingle();

            if (porNome) {
                const result = await supabaseClient.from("players").update({
                    user_id: user.id,
                    bey_favorito: bey,
                    avatar_url: avatar,
                    accent_color: accent,
                    bio: bio
                }).eq("id", porNome.id);
                error = result.error;
            } else {
                const result = await supabaseClient.from("players").insert([{
                    nome: nome,
                    rp: 0,
                    user_id: user.id,
                    bey_favorito: bey,
                    avatar_url: avatar,
                    accent_color: accent,
                    bio: bio
                }]);
                error = result.error;
            }
        }

        if (error) {
            if (feedback) feedback.textContent = "Erro: " + error.message;
            return;
        }
        if (feedback) feedback.textContent = "Perfil salvo!";
        await carregarPerfilSimples();
        return;
    }

    if (!meuPerfil) return;
    const result = await supabaseClient.from("players").update({
        bey_favorito: document.getElementById("profile-favorite-bey").value.trim(),
        avatar_url: document.getElementById("profile-avatar-url").value.trim(),
        accent_color: document.getElementById("profile-accent-color").value,
        bio: document.getElementById("profile-bio").value.trim()
    }).eq("id", meuPerfil.id);
    if (result.error) {
        if (feedback) feedback.textContent = "Erro: " + result.error.message;
        return;
    }
    if (feedback) feedback.textContent = "Perfil salvo!";
    if (typeof carregarPerfilPagina === "function") carregarPerfilPagina();
}

async function recarregarPerfil() {
    const feedback = document.getElementById("profile-feedback") || document.getElementById("profile-feedback2");
    if (feedback) feedback.textContent = "Recarregando...";

    if (document.getElementById("profile-nickname")) {
        await carregarPerfilSimples();
    } else if (typeof carregarPerfilPagina === "function") {
        await carregarPerfilPagina();
    }

    if (feedback) feedback.textContent = "Perfil recarregado.";
}

// =====================================================
// PERFIL COMPLETO (se usar a outra versão do HTML)
// =====================================================
async function carregarPerfilPagina() {
    const { data: sessionData } = await supabaseClient.auth.getSession();
    const usuarioAtual = sessionData.session && sessionData.session.user;
    const params = new URLSearchParams(window.location.search);
    const idParam = params.get("id");
    const telaCriacao = document.getElementById("tela-criacao");
    const telaPerfil = document.getElementById("tela-perfil");
    const telaLogin = document.getElementById("tela-login-perfil");

    if (telaCriacao) telaCriacao.classList.add("hidden");
    if (telaPerfil) telaPerfil.classList.add("hidden");
    if (telaLogin) telaLogin.classList.add("hidden");

    let player = null;
    if (idParam) {
        const { data } = await supabaseClient.from("players").select("*").eq("id", idParam).maybeSingle();
        player = data;
    } else if (usuarioAtual) {
        const { data } = await supabaseClient.from("players").select("*").eq("user_id", usuarioAtual.id).maybeSingle();
        player = data;
    }

    if (document.body.classList.contains("admin-mode")) {
        carregarSeletorAdmPerfil(player && player.id);
    }

    if (player) {
        meuPerfil = player;
        perfilAtualId = player.id;
        if (telaPerfil) telaPerfil.classList.remove("hidden");
        renderizarPerfilCompleto(player);
        const souDono = usuarioAtual && player.user_id === usuarioAtual.id;
        const edicao = document.getElementById("edicao-basica");
        if (edicao) edicao.style.display = souDono ? "block" : "none";
        return;
    }

    if (usuarioAtual) {
        if (telaCriacao) telaCriacao.classList.remove("hidden");
        return;
    }

    if (telaLogin) telaLogin.classList.remove("hidden");
}

async function carregarSeletorAdmPerfil(selectedId) {
    const { data } = await supabaseClient.from("players").select("id,nome").order("nome");
    const select = document.getElementById("admin-select-player");
    if (!select) return;
    select.innerHTML = (data || []).map(function (p) {
        return '<option value="' + p.id + '">' + p.nome + "</option>";
    }).join("");
    if (selectedId) select.value = selectedId;
    select.onchange = function () {
        window.location.href = "perfil.html?id=" + select.value;
    };
}

function rankPositionOf(id) {
    const idx = players.findIndex(function (pl) { return pl.id === id; });
    return idx === -1 ? null : idx + 1;
}

function escapeHTML(s) {
    return (s || "").toString().replace(/[&<>"']/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
}

function barraHtml(nome, pct, classe) {
    pct = pct || 0;
    return '<div class="bar-row">' +
        '<div class="name">' + nome + "</div>" +
        '<div class="bar-track"><div class="bar-fill ' + classe + '" style="width:' + pct + '%"></div></div>' +
        '<div class="pct">' + pct + "%</div>" +
        "</div>";
}

function renderizarPerfilCompleto(p) {
    if (!document.getElementById("profile-classificacao")) return;
    const classe = getClassificacao(p.rp || 0);
    document.getElementById("profile-classificacao").textContent = classe.texto;
    document.getElementById("profile-display-name").textContent = p.nome;
    const fav = document.getElementById("profile-favorite-line");
    if (fav) fav.textContent = p.bey_favorito ? ("Bey favorito: " + p.bey_favorito) : "";
    const bioLine = document.getElementById("profile-bio-line");
    if (bioLine) bioLine.textContent = p.bio || "";

    const avatarBox = document.getElementById("profile-avatar-preview");
    const initials = document.getElementById("profile-avatar-initials");
    if (avatarBox && initials) {
        if (p.avatar_url) {
            avatarBox.style.backgroundImage = "url(" + p.avatar_url + ")";
            avatarBox.classList.add("has-image");
            initials.style.display = "none";
        } else {
            avatarBox.style.backgroundImage = "";
            avatarBox.classList.remove("has-image");
            initials.style.display = "block";
            initials.textContent = (p.nome || "?")[0].toUpperCase();
        }
    }

    const atr = p.atributos || { ataque: 50, defesa: 50, resistencia: 50 };
    const barras = document.getElementById("barras-atributos");
    if (barras) {
        barras.innerHTML =
            barraHtml("Ataque", atr.ataque, "attack") +
            barraHtml("Defesa", atr.defesa, "defense") +
            barraHtml("Resistência", atr.resistencia, "stamina");
    }
}

async function criarMeuPerfil() {
    const nomeEl = document.getElementById("criar-nome");
    if (!nomeEl) return;
    const nome = nomeEl.value.trim();
    const feedback = document.getElementById("profile-feedback");
    if (!nome) {
        if (feedback) feedback.textContent = "Digite seu nome.";
        return;
    }
    const { data: sessionData } = await supabaseClient.auth.getSession();
    const user = sessionData.session && sessionData.session.user;
    if (!user) return;
    const { error } = await supabaseClient.from("players").insert([{
        nome: nome,
        rp: 0,
        user_id: user.id,
        bey_favorito: (document.getElementById("criar-bey") && document.getElementById("criar-bey").value || "").trim(),
        estilo_batalha: (document.getElementById("criar-estilo") && document.getElementById("criar-estilo").value) || "",
        avatar_url: (document.getElementById("criar-avatar") && document.getElementById("criar-avatar").value || "").trim(),
        bio: (document.getElementById("criar-bio") && document.getElementById("criar-bio").value || "").trim()
    }]);
    if (error) {
        if (feedback) feedback.textContent = "Erro: " + error.message;
        return;
    }
    window.location.href = "perfil.html";
}
