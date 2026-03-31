 window.onload = function() {
    const nomeSalvo = localStorage.getItem('usuario_nome');
    const perfilSalvo = localStorage.getItem('usuario_perfil');
    if (nomeSalvo && perfilSalvo) {
        configurarPainelPorPerfil(nomeSalvo, perfilSalvo);
    }
}

//  1 LOGIN
async function fazerLogin(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;

    try {
        const resposta = await fetch('http://127.0.0.1:8000/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, senha: senha })
        });

        if (resposta.ok) {
            const dados = await resposta.json();
            localStorage.setItem('usuario_nome', dados.nome);
            localStorage.setItem('usuario_perfil', dados.perfil);
            configurarPainelPorPerfil(dados.nome, dados.perfil);
        } else {
            alert("Acesso Negado: E-mail ou senha incorretos.");
        }
    } catch (error) {
        alert("Erro: O servidor da API (Uvicorn) não está rodando!");
    }
}

// 2 CONFIGURA A TELA BASEADO NO PERFIL
function configurarPainelPorPerfil(nome, perfil) {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('app-section').style.display = 'flex';
    document.querySelectorAll('.menu-grupo').forEach(m => m.style.display = 'none');
    document.getElementById('badge-perfil').innerText = perfil || 'Usuário';

    let idPrimeiraAba = '';

    if (perfil === 'Professor') {
        document.getElementById('titulo-portal').innerText = 'Portal Docente';
        document.getElementById('texto-boas-vindas').innerText = `Bem-vindo, Prof. ${nome}!`;
        document.getElementById('menu-professor').style.display = 'flex';
        idPrimeiraAba = 'aba-prof-dashboard';

        
        carregarRequerimentos();
        carregarDropdownReservas(); 
        carregarReservas();         
    } 
    else if (perfil === 'Aluno') {
        document.getElementById('titulo-portal').innerText = 'Portal do Aluno';
        document.getElementById('texto-boas-vindas').innerText = `Olá, ${nome}!`;
        document.getElementById('menu-aluno').style.display = 'flex';
        idPrimeiraAba = 'aba-aluno-dashboard';
    } 
    else { 
        document.getElementById('titulo-portal').innerText = 'Setor de Compras';
        document.getElementById('texto-boas-vindas').innerText = `Visão Administrativa: ${nome}`;
        document.getElementById('menu-compras').style.display = 'flex';
        idPrimeiraAba = 'aba-compras-dashboard';

        carregarAcessorios('tabela-compras-acessorios'); 
        carregarRequerimentos(); 
        gerarCodigoPatrimonio();
    }

    const menuAtivo = document.getElementById(perfil === 'Professor' ? 'menu-professor' : (perfil === 'Aluno' ? 'menu-aluno' : 'menu-compras'));
    if (menuAtivo) {
        const primeiroBotao = menuAtivo.querySelector('.menu-btn');
        mudarAba(idPrimeiraAba, primeiroBotao);
    }
}

// 3 NAVEGAÇÃO ENTRE ABAS 
function mudarAba(idAba, botaoClicado) {
    document.querySelectorAll('.aba').forEach(aba => aba.classList.remove('ativa'));
    document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('ativo'));
    const abaAlvo = document.getElementById(idAba);
    if(abaAlvo) abaAlvo.classList.add('ativa');
    if(botaoClicado) botaoClicado.classList.add('ativo');
}

// 4 CARREGAR ACESSÓRIOS DO POSTGRES 
async function carregarAcessorios(idTabelaAlvo) {
    try {
        const resposta = await fetch('http://127.0.0.1:8000/acessorios/');
        const itens = await resposta.json();
        const tbody = document.getElementById(idTabelaAlvo);
        if(!tbody) return; 
        tbody.innerHTML = ""; 

        if(itens.length === 0) {
            tbody.innerHTML = "<tr><td colspan='4' style='text-align:center;'>Nenhum acessório cadastrado.</td></tr>";
            return;
        }

        itens.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>#${item.id}</td><td><strong>${item.nome}</strong></td><td>${item.codigo_patrimonio}</td><td><span class="status-ok">${item.status}</span></td>`;
            tbody.appendChild(tr);
        });
    } catch (error) { console.error("Erro ao buscar acessórios"); }
}

// 5 CADASTRAR NOVO ACESSÓRIO
async function cadastrarAcessorio(event) {
    event.preventDefault();
    const nome = document.getElementById('nome-acessorio').value;
    const patrimonio = document.getElementById('patrimonio-acessorio').value;

    try {
        const resposta = await fetch('http://127.0.0.1:8000/acessorios/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome: nome, codigo_patrimonio: patrimonio })
        });

        if (resposta.ok) {
            alert("Equipamento adicionado ao estoque geral!");
            document.getElementById('form-acessorio').reset(); 
            carregarAcessorios('tabela-compras-acessorios'); 
            gerarCodigoPatrimonio();
        }
    } catch (error) { alert("Erro ao salvar no banco."); }
}

// 6 GERAÇÃO AUTOMÁTICA DE PATRIMÔNIO
function gerarCodigoPatrimonio() {
    const ano = new Date().getFullYear();
    const numeroAleatorio = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const campoPatrimonio = document.getElementById('patrimonio-acessorio');
    if(campoPatrimonio) campoPatrimonio.value = `PAT-${ano}-${numeroAleatorio}`;
}

// 7 CARREGAR REQUERIMENTOS DO BANCO
async function carregarRequerimentos() {
    try {
        const resposta = await fetch('http://127.0.0.1:8000/requerimentos/');
        const requerimentos = await resposta.json();
        const tbodyProf = document.getElementById('tabela-prof-meus-requerimentos');
        const tbodyCompras = document.getElementById('tabela-compras-pedidos-dinamica');
        const usuarioLogado = localStorage.getItem('usuario_nome');
        
        if(tbodyProf) tbodyProf.innerHTML = "";
        if(tbodyCompras) tbodyCompras.innerHTML = "";

        requerimentos.forEach(req => {
            let classeStatus = req.status === 'Pendente' ? 'status-pendente' : (req.status === 'Aprovado' ? 'status-ok' : 'status-recusado');
            
            let textoMotivo = "-";
            if (req.status === 'Recusado') {
                textoMotivo = req.motivo_rejeicao || "Sem justificativa informada.";
            } else if (req.status === 'Aprovado') {
                textoMotivo = "Adicionado ao Estoque";
            }

            if (tbodyProf && req.solicitante === usuarioLogado) {
                tbodyProf.innerHTML += `<tr><td>${req.equipamento}</td><td><span class="${classeStatus}">${req.status}</span></td><td>${textoMotivo}</td></tr>`;
            }

            if (tbodyCompras) {
                let botoesAcao = '-';
                if (req.status === 'Pendente') {
                    botoesAcao = `
                        <button onclick="avaliarRequerimento(${req.id}, 'Aprovado')" style="background-color: #27ae60; padding: 5px 10px; font-size: 12px;">✔️ Aprovar</button>
                        <button onclick="avaliarRequerimento(${req.id}, 'Recusado')" style="background-color: #e74c3c; padding: 5px 10px; font-size: 12px; margin-left: 5px;">❌ Recusar</button>
                    `;
                }
                tbodyCompras.innerHTML += `<tr><td>${req.solicitante}</td><td>${req.equipamento}</td><td>${req.justificativa}</td><td><span class="${classeStatus}">${req.status}</span></td><td>${botoesAcao}</td></tr>`;
            }
        });
    } catch (error) { console.error("Erro ao buscar requerimentos"); }
}

// 8 PROFESSOR ENVIA REQUERIMENTO
async function enviarRequerimento(event) {
    event.preventDefault();
    const equipamento = document.getElementById('req-equipamento').value;
    const justificativa = document.getElementById('req-justificativa').value;
    const solicitante = localStorage.getItem('usuario_nome') || "Professor";

    const resposta = await fetch('http://127.0.0.1:8000/requerimentos/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ solicitante, equipamento, justificativa })
    });

    if (resposta.ok) {
        alert("Requerimento registrado com sucesso!");
        document.getElementById('form-prof-req').reset();
        carregarRequerimentos();
    }
}

// 9 COMPRAS AVALIA REQUERIMENTO
async function avaliarRequerimento(id, novoStatus) {
    let motivo = null;
    if (novoStatus === 'Recusado') {
        motivo = prompt("Qual o motivo da recusa?");
        if (!motivo) return; 
    }

    const resposta = await fetch(`http://127.0.0.1:8000/requerimentos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus, motivo_rejeicao: motivo })
    });

    if (resposta.ok) {
        alert(`Requerimento ${novoStatus.toLowerCase()}!`);
        carregarRequerimentos();
    }
}

// 10 CARREGAR OPÇÕES DE RESERVA
async function carregarDropdownReservas() {
    try {
        const resposta = await fetch('http://127.0.0.1:8000/acessorios/');
        const itens = await resposta.json();
        const select = document.getElementById('select-equipamento');
        if(!select) return;

        select.innerHTML = '<option value="">Selecione o Equipamento ou Sala...</option>';
        select.innerHTML += '<option value="Sala de Informática 01"> Sala de Informática 01</option>';
        select.innerHTML += '<option value="Laboratório de Redes"> Laboratório de Redes</option>';

        itens.forEach(item => {
            select.innerHTML += `<option value="${item.nome}">${item.nome} (Pat: ${item.codigo_patrimonio})</option>`;
        });
    } catch (error) { console.error("Erro ao carregar equipamentos para reserva"); }
}

// 11. ENVIAR NOVA RESERVA
async function enviarReserva(event) {
    event.preventDefault();
    const equipamento = document.getElementById('select-equipamento').value;
    const data = document.getElementById('data-reserva').value;
    const solicitante = localStorage.getItem('usuario_nome') || "Professor";

    try {
        const resposta = await fetch('http://127.0.0.1:8000/reservas/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ solicitante, equipamento, data_reserva: data })
        });

        if (resposta.ok) {
            alert("Reserva confirmada com sucesso!");
            document.getElementById('form-reserva').reset();
            carregarReservas(); // Atualiza a tabela na mesma hora
        } else {
            // Se o Python der erro, ele joga na tela em vez de travar!
            const erro = await resposta.text();
            alert(" O servidor recusou a reserva. Erro: " + erro);
        }
    } catch (error) {
        
        alert(" Erro do Navegador: " + error.message);
    }
}

// 12. CARREGAR HISTÓRICO NO DASHBOARD
async function carregarReservas() {
    try {
        const resposta = await fetch('http://127.0.0.1:8000/reservas/');
        const tbody = document.getElementById('tabela-historico-reservas');
        if(!tbody) return;
        
        // Se a tabela não existir no banco, ele mostra o erro na tela
        if (!resposta.ok) {
            tbody.innerHTML = "<tr><td colspan='3' style='text-align:center; color:red;'> Erro: Tabela de reservas não encontrada no banco.</td></tr>";
            return;
        }

        const reservas = await resposta.json();
        tbody.innerHTML = "";
        const usuarioLogado = localStorage.getItem('usuario_nome');
        let temReserva = false;

        reservas.forEach(r => {
            if (r.solicitante === usuarioLogado) {
                temReserva = true;
                let badgeStatus = r.devolvido ? '<span class="status-ok">Devolvido</span>' : '<span class="status-pendente">Em Uso</span>';
                tbody.innerHTML += `<tr><td><strong>${r.equipamento}</strong></td><td>${r.data_reserva}</td><td>${badgeStatus}</td></tr>`;
            }
        });

        if(!temReserva) {
            tbody.innerHTML = "<tr><td colspan='3' style='text-align:center;'>Nenhuma reserva registrada.</td></tr>";
        }
    } catch (error) { 
        console.error("Erro ao buscar reservas"); 
    }
}

//13 SAIR
function sair() {
    localStorage.clear();
    document.getElementById('app-section').style.display = 'none';
    document.getElementById('login-section').style.display = 'flex';
    document.getElementById('form-login').reset();
    document.getElementById('email').value = "";
    document.getElementById('senha').value = "";
}
// 14. ENVIAR CSV DE USUÁRIOS PARA O BACKEND
async function enviarCSV() {
    const input = document.getElementById('arquivoCsv');
    if (input.files.length === 0) {
        alert("Selecione um arquivo CSV primeiro!");
        return;
    }

    const formData = new FormData();
    formData.append("arquivo", input.files[0]);

    try {
        const response = await fetch("http://127.0.0.1:8000/upload-usuarios/", {
            method: "POST",
            body: formData
        });
        
        const data = await response.json();
        
       
        if (response.ok) {
            alert(data.mensagem);
            carregarUsuarios(); 
        } else {
           
            alert("Falha ao importar: O arquivo contém e-mails já cadastrados ou estrutura inválida.\n\nDetalhe técnico: " + data.detail);
        }
    } catch (error) {
        alert("Erro de conexão ao enviar CSV.");
    }
}

// 15. ATUALIZAÇÃO EM TEMPO REAL DO HISTÓRICO DE RESERVAS
function buscarReservasTempoReal() {
    fetch('http://127.0.0.1:8000/reservas/')
        .then(res => res.json())
        .then(data => {
            const tbody = document.getElementById('tabela-historico-reservas'); // Ajuste para o ID da sua tabela
            tbody.innerHTML = '';
            
            data.forEach(reserva => {
                const tr = document.createElement('tr');
                
                // Se a reserva não foi devolvida, adiciona uma classe para destacar
                if(!reserva.devolvido) {
                    tr.classList.add('em-uso-glow');
                }

                tr.innerHTML = `
                    <td>${reserva.equipamento}</td>
                    <td>${reserva.data_reserva}</td>
                    <td>${reserva.devolvido ? "Devolvido" : "Em Uso"}</td>
                    <td>
                        <a href="http://127.0.0.1:8000/gerar-pdf/${reserva.id}" target="_blank" style="color: blue; text-decoration: underline;">Imprimir Termo PDF</a>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            
            // Atualiza o Gráfico após buscar os dados
            atualizarGrafico(data);
        });
}

// Atualiza a tabela automaticamente a cada 5 segundos 
setInterval(buscarReservasTempoReal, 5000);
// Chama uma vez logo que a página carrega
buscarReservasTempoReal();

// 16. GRÁFICO DE OCUPAÇÃO DO LABORATÓRIO
let meuGrafico;
function atualizarGrafico(reservas) {
    // Conta quantas reservas estão em uso e quantas foram devolvidas
    let emUso = reservas.filter(r => !r.devolvido).length;
    let devolvidos = reservas.filter(r => r.devolvido).length;

    const ctx = document.getElementById('graficoOcupacao');
    
    // Se o gráfico já existe, apenas atualiza os dados
    if (meuGrafico) {
        meuGrafico.data.datasets[0].data = [emUso, devolvidos];
        meuGrafico.update();
        return;
    }

    // Se não existe, cria o gráfico
    meuGrafico = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Equipamentos Em Uso', 'Equipamentos Devolvidos'],
            datasets: [{
                data: [emUso, devolvidos],
                backgroundColor: ['#ffc107', '#28a745'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: { display: true, text: 'Visão Geral do Laboratório' }
            }
        }
    });
}
// 17. DEVOÇÃO DE ITENS DIRETO DO DASHBOARD
function buscarReservasTempoReal() {
    fetch('http://127.0.0.1:8000/reservas/')
        .then(res => res.json())
        .then(data => {
            const tbody = document.getElementById('tabela-historico-reservas');
            if (!tbody) return;
            
            tbody.innerHTML = '';
            
            data.forEach(reserva => {
                const tr = document.createElement('tr');
                
                if(!reserva.devolvido) {
                    tr.classList.add('em-uso-glow');
                }

                // Lógica do botão de devolução: só aparece se não foi devolvido
                const botaoDevolver = !reserva.devolvido 
                    ? `<button onclick="devolverItem(${reserva.id})" style="background-color: #3498db; padding: 5px 10px; font-size: 12px; margin-right: 5px;">↩ Devolver</button>` 
                    : `<span style="color: #27ae60; font-weight: bold;">✔ Finalizado</span>`;

                tr.innerHTML = `
                    <td>${reserva.equipamento}</td>
                    <td>${reserva.data_reserva}</td>
                    <td>${reserva.devolvido ? "Devolvido" : "Em Uso"}</td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            ${botaoDevolver}
                            <a href="http://127.0.0.1:8000/gerar-pdf/${reserva.id}" target="_blank" style="font-size: 12px; color: #7f8c8d;">📄 PDF</a>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            
            atualizarGrafico(data);
        });
}

// Função para devolver item/sala
async function devolverItem(id) {
    if(!confirm("Confirmar a devolução deste item/sala?")) return;

    try {
        const response = await fetch(`http://127.0.0.1:8000/reservas/${id}/devolver`, {
            method: 'PUT'
        });
        
        if (response.ok) {
            const data = await response.json();
            alert(data.mensagem);
            buscarReservasTempoReal(); // Atualiza a tela imediatamente
        } else {
            alert("Erro ao processar devolução no servidor.");
        }
    } catch (error) {
        console.error("Erro na requisição:", error);
        alert("Não foi possível conectar ao servidor.");
    }
}
// 18. CARREGAR USUÁRIOS CADASTRADOS (APENAS PARA ADMIN)
// FUNÇÃO PARA LISTAR OS USUÁRIOS NA TELA DO ADMIN (ATUALIZADA)
function carregarUsuarios() {
    fetch('http://127.0.0.1:8000/usuarios/')
        .then(res => res.json())
        .then(data => {
            const tbody = document.getElementById('tabela-usuarios-cadastrados');
            if (!tbody) return;
            
            tbody.innerHTML = ''; 
            
            data.forEach(user => {
                const tr = document.createElement('tr');
                
                let corPerfil = "#7f8c8d"; 
                if (user.perfil === "Professor") corPerfil = "#2980b9"; 
                if (user.perfil === "Aluno") corPerfil = "#27ae60"; 
                if (user.perfil === "TI/Recepcao" || user.perfil === "Admin") corPerfil = "#e67e22"; 

                tr.innerHTML = `
                    <td><b>#${user.id}</b></td>
                    <td>${user.nome}</td>
                    <td>${user.matricula}</td>
                    <td>${user.email}</td>
                    <td><span style="background-color: ${corPerfil}; color: white; padding: 3px 8px; border-radius: 12px; font-size: 12px;">${user.perfil}</span></td>
                    <td>
                        <button onclick="deletarUsuario(${user.id})" style="background-color: #e74c3c; padding: 5px 10px; font-size: 12px;">🗑️ Excluir</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        })
        .catch(erro => console.error("Erro ao carregar usuários:", erro));
}

// NOVA FUNÇÃO: DELETAR USUÁRIO
async function deletarUsuario(id) {
    if (!confirm("Tem certeza que deseja excluir este usuário? Essa ação não pode ser desfeita.")) return;

    try {
        const response = await fetch(`http://127.0.0.1:8000/usuarios/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            const data = await response.json();
            alert(data.mensagem);
            carregarUsuarios(); // Atualiza a tabela na mesma hora sumindo com o usuário
        } else {
            alert("Erro ao excluir usuário no servidor.");
        }
    } catch (error) {
        console.error("Erro na requisição:", error);
        alert("Não foi possível conectar ao servidor.");
    }
}