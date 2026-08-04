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

    // Perfil simples (profile-nickname) ou perfil completo (tela-criacao)
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

    // Ranking e outras páginas
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
    document.body.classList.remove("admin-mode");
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

window.addEventListener("pageshow", () => {
    verificarSessao();
});

// =============================================
// DADOS PADRÃO / RANKING
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

function entrarAdmin() {
    const senha = prompt("Digite a senha de Administrador:");
    if (senha === "ADM2008") {
        document.body.classList.add("admin-mode");
        alert("Modo Administrador ativado!");
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
// PERFIL SIMPLES (seu perfil.html atual)
// =====================================================
async function carregarPerfilSimples() {
    const { data: sessionData } = await supabaseClient.auth.getSession();
    const user = sessionData.session?.user;
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

    const nome = player?.nome || "";
    const bey = player?.bey_favorito || "";
    const avatar = player?.avatar_url || "";
    const accent = player?.accent_color || "#00b4ff";
    const bio = player?.bio || "";

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
    if (favLine) favLine.textContent = bey ? `Bey favorito: ${bey}` : "";

    const avatarBox = document.getElementById("profile-avatar-preview");
    const initials = document.getElementById("profile-avatar-initials");
    if (avatarBox && initials) {
        if (avatar) {
            avatarBox.style.backgroundImage = `url(${avatar})`;
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
    const feedback = document.getElementById("profile-feedback");
    const { data: sessionData } = await supabaseClient.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) {
        if (feedback) feedback.textContent = "Faça login para salvar.";
        return;
    }

    const nome = (document.getElementById("profile-nickname")?.value || "").trim();
    const bey = (document.getElementById("profile-favorite-bey")?.value || "").trim();
    const avatar = (document.getElementById("profile-avatar-url")?.value || "").trim();
    const accent = document.getElementById("profile-accent-color")?.value || "#00b4ff";
    const bio = (document.getElementById("profile-bio")?.value || "").trim();

    if (!nome) {
        if (feedback) feedback.textContent = "Digite um apelido.";
        return;
    }

    // Já tem player vinculado a esta conta?
    const { data: existente } = await supabaseClient
        .from("players")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

    let error;
    if (existente) {
        // Atualiza o que já existe (não cria duplicado)
        ({ error } = await supabaseClient.from("players").update({
            nome,
            bey_favorito: bey,
            avatar_url: avatar,
            accent_color: accent,
            bio
        }).eq("id", existente.id));
    } else {
        // Tenta achar no ranking pelo mesmo nome (sem user_id) e vincular
        const { data: porNome } = await supabaseClient
            .from("players")
            .select("id")
            .eq("nome", nome)
            .is("user_id", null)
            .maybeSingle();

        if (porNome) {
            // Vincula a conta ao perfil que já estava no ranking
            ({ error } = await supabaseClient.from("players").update({
                user_id: user.id,
                bey_favorito: bey,
                avatar_url: avatar,
                accent_color: accent,
                bio
            }).eq("id", porNome.id));
        } else {
            // Nome novo: cria entrada no ranking
            ({ error } = await supabaseClient.from("players").insert([{
                nome,
                rp: 0,
                user_id: user.id,
                bey_favorito: bey,
                avatar_url: avatar,
                accent_color: accent,
                bio
            }]));
        }
    }

    if (error) {
        if (feedback) feedback.textContent = "Erro: " + error.message;
        return;
    }

    if (feedback) feedback.textContent = "Perfil salvo!";
    await carregarPerfilSimples();
}

async function recarregarPerfil() {
    const feedback = document.getElementById("profile-feedback");
    if (feedback) feedback.textContent = "Recarregando...";
    await carregarPerfilSimples();
    if (feedback) feedback.textContent = "Perfil recarregado.";
}
