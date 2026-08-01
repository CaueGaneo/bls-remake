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
        carregarPlayers();
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