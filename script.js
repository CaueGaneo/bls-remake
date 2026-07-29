// ===========================
// CONFIGURAÇÕES
// ===========================

const SUPABASE_URL = "https://mvktemmkzzmaqqmnpo.supabase.co";
const SUPABASE_KEY = "sb_publishable_hN9NakLX5Vb27LmTuBcevg_rrd7it0p";

let supabase = null;
let players = [];
let adminMode = false;

// Jogadores criados automaticamente caso o banco esteja vazio
const playersPadrao = [
    { nome: "Cauê", rp: 453 },
    { nome: "João", rp: 423 },
    { nome: "Lorex", rp: 331 },
    { nome: "Davi", rp: 170 },
    { nome: "Enzo", rp: 157 },
    { nome: "Mickey", rp: 156 },
    { nome: "Rafa", rp: 6 }
];

// ===========================
// CONEXÃO COM O SUPABASE
// ===========================

function initSupabase() {

    if (!window.supabase) {
        alert("Erro ao carregar o Supabase.");
        return;
    }

    supabase = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );
}

// ===========================
// CLASSIFICAÇÕES
// ===========================

function getClassificacao(rp) {

    if (rp >= 4200)
        return { texto: "👑 Lendário", classe: "lendario" };

    if (rp >= 3150)
        return { texto: "🟢 Esmeralda", classe: "esmeralda" };

    if (rp >= 2300)
        return { texto: "🔹 Safira", classe: "safira" };

    if (rp >= 1650)
        return { texto: "💎 Diamante", classe: "diamante" };

    if (rp >= 1150)
        return { texto: "🔷 Platina", classe: "platina" };

    if (rp >= 750)
        return { texto: "🟡 Ouro", classe: "ouro" };

    if (rp >= 450)
        return { texto: "🥈 Prata", classe: "prata" };

    if (rp >= 250)
        return { texto: "⚪ Ferro", classe: "ferro" };

    if (rp >= 100)
        return { texto: "🟠 Cobre", classe: "cobre" };

    return {
        texto: "🟤 Bronze",
        classe: "bronze-class"
    };
}

// ===========================
// CARREGAR PLAYERS
// ===========================

async function carregarPlayers() {

    const { data, error } = await supabase
        .from("players")
        .select("*")
        .order("rp", { ascending: false });

    if (error) {

        console.error(error);

        alert("Erro ao carregar o ranking.");

        return;
    }

    // Banco vazio
    if (data.length === 0) {

        const { error: erroInsert } = await supabase
            .from("players")
            .insert(playersPadrao);

        if (erroInsert) {

            console.error(erroInsert);

            return;
        }

        return carregarPlayers();
    }

    players = data;

    renderizarTabela();
}

// ===========================
// RENDERIZAÇÃO DA TABELA
// ===========================

function renderizarTabela() {

    players.sort((a, b) => b.rp - a.rp);

    const tbody = document.getElementById("ranking-body");

    tbody.innerHTML = "";

    players.forEach((player, index) => {

        const posicao = index + 1;

        const classificacao = getClassificacao(player.rp);

        let medalha = "";

        if (posicao === 1)
            medalha = "gold";

        if (posicao === 2)
            medalha = "silver";

        if (posicao === 3)
            medalha = "bronze";

        const tr = document.createElement("tr");

        if (posicao <= 3)
            tr.classList.add(`rank-${posicao}`);

        tr.innerHTML = `

<td>

<span class="rank-badge ${medalha}">
${posicao}
</span>

</td>

<td class="blader-name">

<span class="nome-texto">

${player.nome}

</span>

<input
class="edit-input nome"
type="text"
value="${player.nome}"
data-id="${player.id}"
>

</td>

<td>

<span class="class-badge ${classificacao.classe}">

${classificacao.texto}

</span>

</td>

<td class="rp">

<span class="rp-texto">

${player.rp}

</span>

<input
class="edit-input"
type="number"
value="${player.rp}"
data-id="${player.id}"
>

</td>

<td class="admin-only">

<button
class="btn-acao btn-excluir"
onclick="excluirPlayer(${player.id}, '${player.nome}')">

🗑️

</button>

</td>

`;

        tbody.appendChild(tr);

    });

}

// ===========================
// MODO ADMIN
// ===========================

function entrarAdmin() {

    const senha = prompt("Digite a senha do administrador:");

    if (senha !== "ADM2008") {

        alert("Senha incorreta.");

        return;
    }

    adminMode = true;

    document.body.classList.add("admin-mode");

    alert("Modo administrador ativado.");

}

function sairAdmin() {

    adminMode = false;

    document.body.classList.remove("admin-mode");

}
// ===========================
// ADICIONAR PLAYER
// ===========================

async function adicionarPlayer() {

    const nome = prompt("Nome do novo player:");

    if (!nome || nome.trim() === "") return;

    const rp = prompt("RP inicial:", "0");

    if (rp === null) return;

    const { error } = await supabase
        .from("players")
        .insert([
            {
                nome: nome.trim(),
                rp: Number(rp) || 0
            }
        ]);

    if (error) {

        alert("Erro ao adicionar jogador.");

        console.error(error);

        return;
    }

    carregarPlayers();

}

// ===========================
// EXCLUIR PLAYER
// ===========================

async function excluirPlayer(id, nome) {

    const confirmar = confirm(`Excluir ${nome}?`);

    if (!confirmar) return;

    const { error } = await supabase
        .from("players")
        .delete()
        .eq("id", id);

    if (error) {

        alert("Erro ao excluir.");

        console.error(error);

        return;
    }

    carregarPlayers();

}

// ===========================
// SALVAR ALTERAÇÕES
// ===========================

async function salvarTudo() {

    const linhas = document.querySelectorAll("#ranking-body tr");

    for (const linha of linhas) {

        const nome = linha.querySelector(".edit-input.nome");

        const rp = linha.querySelector(".edit-input[type='number']");

        if (!nome || !rp) continue;

        const id = Number(nome.dataset.id);

        const { error } = await supabase
            .from("players")
            .update({

                nome: nome.value.trim(),

                rp: Number(rp.value) || 0

            })
            .eq("id", id);

        if (error) {

            console.error(error);

            alert("Erro ao salvar alterações.");

            return;

        }

    }

    alert("Alterações salvas!");

    carregarPlayers();

}

// ===========================
// EVENTOS DOS BOTÕES
// ===========================

function registrarEventos() {

    document
        .getElementById("btn-adm")
        .addEventListener("click", entrarAdmin);

    document
        .getElementById("btn-adicionar")
        .addEventListener("click", adicionarPlayer);

    document
        .getElementById("btn-salvar")
        .addEventListener("click", salvarTudo);

    document
        .getElementById("btn-sair")
        .addEventListener("click", sairAdmin);

}

// ===========================
// INICIALIZAÇÃO
// ===========================

window.addEventListener("DOMContentLoaded", async () => {

    initSupabase();

    registrarEventos();

    await carregarPlayers();

});

// ===========================
// FUNÇÕES GLOBAIS
// ===========================

window.excluirPlayer = excluirPlayer;
window.entrarAdmin = entrarAdmin;
window.sairAdmin = sairAdmin;
window.adicionarPlayer = adicionarPlayer;
window.salvarTudo = salvarTudo;