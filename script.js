const SUPABASE_URL = "https://mvktemmkzzmaqqmnpo.supabase.co";
const SUPABASE_KEY = "sb_publishable_hN9NakLX5Vb27LmTuBcevg_rrd7it0p";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);


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


async function carregarPlayers() {
    const { data, error } = await supabase
        .from("players")
        .select("*")
        .order("rp", { ascending: false });

    if (error) {
        console.error("Erro ao carregar:", error);
        alert("Erro ao carregar o ranking. Verifique a conexão.");
        return;
    }

    
    if (data.length === 0) {
        const { error: insertError } = await supabase
            .from("players")
            .insert(playersPadrao);

        if (insertError) {
            console.error("Erro ao inserir dados iniciais:", insertError);
        } else {
            
            return carregarPlayers();
        }
    }

    players = data;
    renderizarTabela();
}


function renderizarTabela() {
    players.sort((a, b) => b.rp - a.rp);

    const tbody = document.getElementById("ranking-body");
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

    const { error } = await supabase
        .from("players")
        .insert([{ nome: nome.trim(), rp: Number(rp) || 0 }]);

    if (error) {
        alert("Erro ao adicionar player: " + error.message);
    } else {
        alert("Player adicionado!");
        carregarPlayers();
    }
}


async function excluirPlayer(id, nome) {
    if (!confirm(`Tem certeza que deseja excluir ${nome}?`)) return;

    const { error } = await supabase
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
            await supabase.from("players").update({ nome: novoNome }).eq("id", id);
        }
    }

    for (const input of inputsRP) {
        const id = input.dataset.id;
        const novoRP = Number(input.value) || 0;
        await supabase.from("players").update({ rp: novoRP }).eq("id", id);
    }

    alert("Alterações salvas com sucesso!");
    carregarPlayers();
}


carregarPlayers();