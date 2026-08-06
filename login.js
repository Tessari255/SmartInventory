let choicesProfessor = null;
let choicesAluno = null;
let graficoDiretoriaInstancia = null;
let meuGrafico = null; 

window.onload = function() {
    const nomeSalvo = localStorage.getItem('usuario_nome');
    const perfilSalvo = localStorage.getItem('usuario_perfil');
    if (nomeSalvo && perfilSalvo) {
        configurarPainelPorPerfil(nomeSalvo, perfilSalvo);
    }
}

// 1. LOGIN
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

// 2. CONFIGURA A TELA BASEADO NO PERFIL
function configurarPainelPorPerfil(nome, perfil) {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('app-section').style.display = 'flex';
    document.querySelectorAll('.menu-grupo').forEach(m => m.style.display = 'none');
    document.getElementById('badge-perfil').innerText = perfil || 'Usuário';

    let idPrimeiraAba = '';

    const formAluno = document.getElementById('form-aluno-reserva');
    if (formAluno) formAluno.onsubmit = enviarSolicitacaoAluno;

    if (perfil === 'Professor') {
        document.getElementById('titulo-portal').innerText = 'Portal Docente';
        document.getElementById('texto-boas-vindas').innerText = `Bem-vindo, Prof. ${nome}!`;
        document.getElementById('menu-professor').style.display = 'flex';
        idPrimeiraAba = 'aba-prof-dashboard';

        carregarRequerimentos();
        carregarDropdownReservas(); 
        carregarReservas();         
        carregarRequerimentosAlunos(); 
    } 
    else if (perfil === 'Aluno') {
        document.getElementById('titulo-portal').innerText = 'Portal do Aluno';
        document.getElementById('texto-boas-vindas').innerText = `Olá, ${nome}!`;
        document.getElementById('menu-aluno').style.display = 'flex';
        idPrimeiraAba = 'aba-aluno-dashboard';

        carursosAluno(); 
        carregarProfessores(); 
    } 
    else { 
        document.getElementById('titulo-portal').innerText = 'Diretoria';
        document.getElementById('texto-boas-vindas').innerText = `Visão Administrativa: ${nome}`;
        document.getElementById('menu-compras').style.display = 'flex';
        idPrimeiraAba = 'aba-compras-dashboard';

        carregarDashboardDiretoria(); 
        carregarAcessorios('tabela-compras-acessorios'); 
        carregarRequerimentos(); 
        gerarCodigoPatrimonio();
        carregarUsuarios(); 
        carregarSalasCadastradas(); 
    }

    const menuAtivo = document.getElementById(perfil === 'Professor' ? 'menu-professor' : (perfil === 'Aluno' ? 'menu-aluno' : 'menu-compras'));
    if (menuAtivo) {
        const primeiroBotao = menuAtivo.querySelector('.menu-btn');
        mudarAba(idPrimeiraAba, primeiroBotao);
    }
}

// 3. NAVEGAÇÃO ENTRE ABAS 
function mudarAba(idAba, botaoClicado) {
    document.querySelectorAll('.aba').forEach(aba => aba.classList.remove('ativa'));
    document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('ativo'));
    const abaAlvo = document.getElementById(idAba);
    if(abaAlvo) abaAlvo.classList.add('ativa');
    if(botaoClicado) botaoClicado.classList.add('ativo');
}

// 4. CARREGAR ACESSÓRIOS 
async function carregarAcessorios(idTabelaAlvo) {
    try {
        const resposta = await fetch('http://127.0.0.1:8000/acessorios/');
        let itens = await resposta.json();

        itens.sort((a, b) => b.id - a.id);

        const tbody = document.getElementById(idTabelaAlvo);
        if(!tbody) return; 
        tbody.innerHTML = ""; 

        const eDiretoria = idTabelaAlvo === 'tabela-compras-acessorios';

        if(itens.length === 0) {
            const colSpan = eDiretoria ? 5 : 4;
            tbody.innerHTML = `<tr><td colspan='${colSpan}' style='text-align:center;'>Nenhum acessório cadastrado.</td></tr>`;
            return;
        }

        itens.forEach((item, index) => {
            const tr = document.createElement('tr');
            let colAcoes = '';
            
            
            if (eDiretoria) {
                colAcoes = `<td><button onclick="deletarAcessorio(${item.id})" style="background-color: #e74c3c; padding: 5px 10px; font-size: 12px; color: white; border: none; cursor: pointer; border-radius: 4px;">🗑️ Excluir</button></td>`;
            }
            
            tr.innerHTML = `<td><b>#${index + 1}</b></td><td><strong>${item.nome}</strong></td><td>${item.codigo_patrimonio}</td><td><span class="status-ok">${item.status}</span></td>${colAcoes}`;
            tbody.appendChild(tr);
        });
    } catch (error) { console.error("Erro ao buscar acessórios"); }
}

// 5. CADASTRAR NOVO ACESSÓRIO
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
            carregarDashboardDiretoria(); 
        }
    } catch (error) { alert("Erro ao salvar no banco."); }
}

// 6. GERAÇÃO AUTOMÁTICA DE PATRIMÔNIO
function gerarCodigoPatrimonio() {
    const ano = new Date().getFullYear();
    const numeroAleatorio = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const campoPatrimonio = document.getElementById('patrimonio-acessorio');
    if(campoPatrimonio) campoPatrimonio.value = `PAT-${ano}-${numeroAleatorio}`;
}

// 7. CARREGAR REQUERIMENTOS E PAINEL DIRETORIA
async function carregarRequerimentos() {
    try {
        const tbodyProf = document.getElementById('tabela-prof-meus-requerimentos');
        const usuarioLogado = localStorage.getItem('usuario_nome');

        if(tbodyProf) {
            const resProf = await fetch('http://127.0.0.1:8000/requerimentos/');
            const requerimentos = await resProf.json();
            tbodyProf.innerHTML = "";
            requerimentos.forEach(req => {
                if (req.solicitante === usuarioLogado) {
                    let classeStatus = req.status === 'Pendente' ? 'status-pendente' : (req.status === 'Aprovado' ? 'status-ok' : 'status-recusado');
                    let textoMotivo = req.status === 'Recusado' ? (req.motivo_rejeicao || "Sem justificativa") : (req.status === 'Aprovado' ? "Adicionado ao Estoque" : "-");
                    tbodyProf.innerHTML += `<tr><td>${req.equipamento}</td><td><span class="${classeStatus}">${req.status}</span></td><td>${textoMotivo}</td></tr>`;
                }
            });
        }

        const tbodyCompras = document.getElementById('tabela-compras-pedidos-dinamica');
        if(tbodyCompras) {
            const resDiretoria = await fetch('http://127.0.0.1:8000/diretoria/painel-pedidos');
            const painel = await resDiretoria.json();
            tbodyCompras.innerHTML = "";

            painel.forEach(item => {
                let classeStatus = item.status === 'Pendente' ? 'status-pendente' : (item.status === 'Aprovado' ? 'status-ok' : 'status-recusado');
                let botoesAcao = '-';
                
                if (item.status === 'Pendente' && item.tipo === 'Requerimento Professor') {
                    botoesAcao = `
                        <button onclick="avaliarRequerimento(${item.id}, 'Aprovado')" style="background-color: #27ae60; padding: 5px 10px; font-size: 12px;">✔️ Aprovar</button>
                        <button onclick="avaliarRequerimento(${item.id}, 'Recusado')" style="background-color: #e74c3c; padding: 5px 10px; font-size: 12px; margin-left: 5px;">❌ Recusar</button>
                    `;
                } else if (item.status === 'Pendente' && item.tipo === 'Solicitação Aluno') {
                    botoesAcao = `<span style="font-size: 12px; color: #f39c12;">Aguardando Prof.</span>`;
                }

                tbodyCompras.innerHTML += `
                    <tr>
                        <td>${item.origem}</td>
                        <td>${item.recurso}</td>
                        <td>${item.professor_responsavel || '-'}</td>
                        <td>${item.motivo_justificativa}</td>
                        <td><span class="${classeStatus}">${item.status}</span></td>
                        <td>${botoesAcao}</td>
                    </tr>
                `;
            });
        }
    } catch (error) { console.error("Erro ao buscar requerimentos"); }
}

// 8. PROFESSOR ENVIA REQUERIMENTO
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

// 9. COMPRAS/DIRETORIA AVALIA REQUERIMENTO
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
        carregarDashboardDiretoria(); 
    }
}

// 10. CARREGAR OPÇÕES DE RESERVA DO PROFESSOR 
async function carregarDropdownReservas() {
    try {
        const resposta = await fetch('http://127.0.0.1:8000/recursos-disponiveis/');
        const recursos = await resposta.json();
        const select = document.getElementById('select-equipamento');
        if(!select) return;

        if (choicesProfessor) {
            choicesProfessor.destroy();
            choicesProfessor = null;
        }

        select.innerHTML = ''; 

        recursos.forEach(rec => {
            const bloqueado = rec.status === 'Ocupado' ? 'disabled' : '';
            const statusTexto = rec.status === 'Ocupado' ? ' (Em Uso)' : '';
            select.innerHTML += `<option value="${rec.nome}" ${bloqueado}>${rec.nome} - ${rec.modalidade}${statusTexto}</option>`;
        });

        if (typeof Choices !== 'undefined') {
            choicesProfessor = new Choices(select, {
                removeItemButton: true,
                searchEnabled: true,
                placeholderValue: 'Selecione um ou mais itens...',
                itemSelectText: ''
            });
        }
    } catch (error) { console.error("Erro ao carregar equipamentos para reserva", error); }
}

// 11. ENVIAR NOVA RESERVA (PROFESSOR)
async function enviarReserva(event) {
    event.preventDefault();
    const selectEquipamento = document.getElementById('select-equipamento');
    const equipamentosSelecionados = Array.from(selectEquipamento.selectedOptions).map(opt => opt.value).join(', ');
    
    if (!equipamentosSelecionados) {
        alert("Selecione pelo menos um equipamento!");
        return;
    }

    const data = document.getElementById('data-reserva').value;
    const solicitante = localStorage.getItem('usuario_nome') || "Professor";

    try {
        const resposta = await fetch('http://127.0.0.1:8000/reservas/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ solicitante, equipamento: equipamentosSelecionados, data_reserva: data })
        });

        if (resposta.ok) {
            alert("Reserva confirmada com sucesso!");
            document.getElementById('form-reserva').reset();
            
            if(choicesProfessor) choicesProfessor.removeActiveItems();
            
            carregarReservas(); 
            carregarDropdownReservas(); 
        } else {
            const erro = await resposta.text();
            alert(" O servidor recusou a reserva. Erro: " + erro);
        }
    } catch (error) {
        alert(" Erro do Navegador: " + error.message);
    }
}

// 12. CARREGAR HISTÓRICO NO DASHBOARD DO PROFESSOR
async function carregarReservas() {
    try {
        const resposta = await fetch('http://127.0.0.1:8000/reservas/');
        const tbody = document.getElementById('tabela-historico-reservas');
        if(!tbody) return;
        
        if (!resposta.ok) {
            tbody.innerHTML = "<tr><td colspan='3' style='text-align:center; color:red;'> Erro: Tabela de reservas não encontrada.</td></tr>";
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

// 13. SAIR
function sair() {
    localStorage.clear();
    document.getElementById('app-section').style.display = 'none';
    document.getElementById('login-section').style.display = 'flex';
    document.getElementById('form-login').reset();
    document.getElementById('email').value = "";
    document.getElementById('senha').value = "";
}

// 14. ENVIAR CSV DE USUÁRIOS
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
            carregarDashboardDiretoria(); 
        } else {
            alert("Falha ao importar o arquivo CSV.\nVerifique as colunas do arquivo.");
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
            const tbody = document.getElementById('tabela-historico-reservas'); 
            if(!tbody) return;
            
            tbody.innerHTML = '';
            
            data.forEach(reserva => {
                const tr = document.createElement('tr');
                
                if(!reserva.devolvido) {
                    tr.classList.add('em-uso-glow');
                }

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
                            <a href="http://127.0.0.1:8000/gerar-pdf/${reserva.id}" target="_blank" style="font-size: 12px; color: #7f8c8d; text-decoration: underline;">📄 PDF</a>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            
            atualizarGrafico(data);
        })
        .catch(erro => console.log("Aguardando carregamento de reservas..."));
}

setInterval(buscarReservasTempoReal, 5000); 
buscarReservasTempoReal();

// 16. GRÁFICO DE OCUPAÇÃO DO LABORATÓRIO (PROFESSOR)
function atualizarGrafico(reservas) {
    let emUso = reservas.filter(r => !r.devolvido).length;
    let devolvidos = reservas.filter(r => r.devolvido).length;

    const ctx = document.getElementById('graficoOcupacao');
    if (!ctx) return;
    
    if (meuGrafico) {
        meuGrafico.data.datasets[0].data = [emUso, devolvidos];
        meuGrafico.update();
        return;
    }

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

// 17. DEVOLUÇÃO DE ITENS
async function devolverItem(id) {
    if(!confirm("Confirmar a devolução deste item/sala?")) return;

    try {
        const response = await fetch(`http://127.0.0.1:8000/reservas/${id}/devolver`, {
            method: 'PUT'
        });
        
        if (response.ok) {
            const data = await response.json();
            alert(data.mensagem);
            buscarReservasTempoReal(); 
            carregarDashboardDiretoria(); 
            carregarDropdownReservas(); 
            carregarRecursosAluno();    
        } else {
            alert("Erro ao processar devolução no servidor.");
        }
    } catch (error) {
        console.error("Erro na requisição:", error);
    }
}

// 18. CARREGAR USUÁRIOS
function carregarUsuarios() {
    fetch('http://127.0.0.1:8000/usuarios/')
        .then(res => res.json())
        .then(data => {
            const tbody = document.getElementById('tabela-usuarios-cadastrados');
            if (!tbody) return;
            
            tbody.innerHTML = ''; 
            
            data.forEach((user, index) => {
                const tr = document.createElement('tr');
                
                let corPerfil = "#7f8c8d"; 
                if (user.perfil === "Professor") corPerfil = "#2980b9"; 
                if (user.perfil === "Aluno") corPerfil = "#27ae60"; 
                if (user.perfil === "TI/Recepcao" || user.perfil === "Admin") corPerfil = "#e67e22"; 

                tr.innerHTML = `
                    <td><b>#${index + 1}</b></td>
                    <td>${user.nome}</td>
                    <td>${user.matricula}</td>
                    <td>${user.email}</td>
                    <td><span style="background-color: ${corPerfil}; color: white; padding: 3px 8px; border-radius: 12px; font-size: 12px;">${user.perfil}</span></td>
                    <td>
                        <button onclick="deletarUsuario(${user.id})" style="background-color: #e74c3c; padding: 5px 10px; font-size: 12px; color: white; border: none; cursor: pointer; border-radius: 4px;">🗑️ Excluir</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        })
        .catch(erro => console.error("Erro ao carregar usuários:", erro));
}

// 19. DELETAR USUÁRIO
async function deletarUsuario(id) {
    if (!confirm("Tem certeza que deseja excluir este usuário? Essa ação não pode ser desfeita.")) return;

    try {
        const response = await fetch(`http://127.0.0.1:8000/usuarios/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            const data = await response.json();
            alert(data.mensagem);
            carregarUsuarios(); 
            carregarDashboardDiretoria(); 
        } else {
            alert("Erro ao excluir usuário no servidor.");
        }
    } catch (error) {
        console.error("Erro na requisição:", error);
    }
}

// 20. CADASTRAR NOVA SALA
async function cadastrarNovaSala(event) {
    event.preventDefault();
    const nome = document.getElementById('nome-sala').value;
    const modalidade = document.getElementById('modalidade-sala').value;

    try {
        const resposta = await fetch('http://127.0.0.1:8000/salas/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome: nome, modalidade: modalidade })
        });

        if (resposta.ok) {
            alert("Sala cadastrada com sucesso!");
            document.getElementById('form-cadastrar-sala').reset();
            carregarSalasCadastradas();
            carregarDashboardDiretoria(); 
        } else {
            alert("Erro ao cadastrar sala.");
        }
    } catch (error) { alert("Erro de conexão com o servidor."); }
}

// 21. CARREGAR SALAS CADASTRADAS
async function carregarSalasCadastradas() {
    try {
        const resposta = await fetch('http://127.0.0.1:8000/salas/');
        const salas = await resposta.json();
        const tbody = document.getElementById('tabela-diretoria-salas-dinamica');
        if(!tbody) return;
        tbody.innerHTML = "";

        salas.forEach((sala, index) => {
            let classeStatus = sala.status === 'Disponível' ? 'status-ok' : 'status-recusado';
            tbody.innerHTML += `
                <tr>
                    <td>#${index + 1}</td>
                    <td><strong>${sala.nome}</strong></td>
                    <td>${sala.modalidade}</td>
                    <td><span class="${classeStatus}">${sala.status}</span></td>
                    <td>
                        <button onclick="deletarSala(${sala.id})" style="background-color: #e74c3c; padding: 5px 10px; font-size: 12px; color: white; border: none; cursor: pointer; border-radius: 4px;">🗑️ Excluir</button>
                    </td>
                </tr>
            `;
        });
    } catch (error) { console.error("Erro ao buscar salas"); }
}

// 22. CARREGAR RECURSOS PARA O ALUNO (MODERNO)
async function carregarRecursosAluno() {
    try {
        const resposta = await fetch('http://127.0.0.1:8000/recursos-disponiveis/');
        const recursos = await resposta.json();
        const select = document.getElementById('aluno-select-recurso');
        if(!select) return;

        if (choicesAluno) {
            choicesAluno.destroy();
            choicesAluno = null;
        }

        select.innerHTML = ''; 

        recursos.forEach(rec => {
            const bloqueado = rec.status === 'Ocupado' ? 'disabled' : '';
            const statusTexto = rec.status === 'Ocupado' ? ' (Em Uso)' : '';
            select.innerHTML += `<option value="${rec.id}" data-tipo="${rec.tipo}" ${bloqueado}>${rec.nome} - ${rec.modalidade || 'Equipamento'}${statusTexto}</option>`;
        });

        if (typeof Choices !== 'undefined') {
            choicesAluno = new Choices(select, {
                removeItemButton: true,
                searchEnabled: true,
                placeholderValue: 'O que você precisa reservar?',
                itemSelectText: ''
            });
        }
    } catch (error) { console.error("Erro ao carregar recursos para aluno", error); }
}

// 23. VERIFICAR SE O ALUNO SELECIONOU UMA SALA
function verificarSelecaoRecursoAluno(selectElement) {
    const opcoesSelecionadas = Array.from(selectElement.selectedOptions);
    const exigeProfessor = opcoesSelecionadas.some(opcao => opcao.getAttribute('data-tipo') === 'Sala');

    const divProfessor = document.getElementById('div-aluno-professor-responsavel');
    const selectProfessor = document.getElementById('aluno-select-professor');

    if (exigeProfessor) {
        divProfessor.style.display = 'block';
        selectProfessor.setAttribute('required', 'true');
    } else {
        divProfessor.style.display = 'none';
        selectProfessor.removeAttribute('required');
        selectProfessor.value = "";
    }
}

// 24. CARREGAR PROFESSORES PARA O ALUNO
async function carregarProfessores() {
    try {
        const resposta = await fetch('http://127.0.0.1:8000/usuarios/professores');
        const professores = await resposta.json();
        const select = document.getElementById('aluno-select-professor');
        if(!select) return;

        select.innerHTML = '<option value="">Selecione o Professor Presente (Obrigatório para Salas)</option>';
        professores.forEach(prof => {
            select.innerHTML += `<option value="${prof.id}">${prof.nome}</option>`;
        });
    } catch (error) { console.error("Erro ao carregar professores"); }
}

// 25. ENVIAR SOLICITAÇÃO DO ALUNO
async function enviarSolicitacaoAluno(event) {
    event.preventDefault();
    
    const selectRecurso = document.getElementById('aluno-select-recurso');
    const recursosIds = Array.from(selectRecurso.selectedOptions).map(opt => opt.value).join(', ');
    
    if (!recursosIds) {
        alert("Selecione pelo menos um recurso!");
        return;
    }

    const professorId = document.getElementById('aluno-select-professor').value;
    const finalidade = document.querySelector('#form-aluno-reserva textarea').value;
    const alunoNome = localStorage.getItem('usuario_nome');

    try {
        const resposta = await fetch('http://127.0.0.1:8000/solicitacoes-alunos/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                aluno: alunoNome,
                recurso_id: recursosIds, 
                professor_id: professorId || null,
                finalidade: finalidade
            })
        });

        if (resposta.ok) {
            alert("Solicitação enviada com sucesso! Aguarde a aprovação.");
            document.getElementById('form-aluno-reserva').reset();
            
            if(choicesAluno) choicesAluno.removeActiveItems(); 
            
            carregarRecursosAluno(); 
            document.getElementById('div-aluno-professor-responsavel').style.display = 'none';
        } else {
            alert("Erro ao enviar a solicitação.");
        }
    } catch (error) { alert("Erro de conexão ao enviar solicitação."); }
}

// 26. CARREGAR SOLICITAÇÕES DOS ALUNOS PARA O PROFESSOR
async function carregarRequerimentosAlunos() {
    try {
        const professorNome = localStorage.getItem('usuario_nome');
        const resposta = await fetch(`http://127.0.0.1:8000/solicitacoes-alunos/professor/${encodeURIComponent(professorNome)}`);
        const solicitacoes = await resposta.json();
        const tbody = document.getElementById('tabela-prof-aprovacoes-dinamica');
        if(!tbody) return;
        tbody.innerHTML = "";

        solicitacoes.forEach(sol => {
            if(sol.status === 'Pendente') {
                tbody.innerHTML += `
                    <tr>
                        <td>${sol.aluno}</td>
                        <td>${sol.recurso_nome}</td>
                        <td>${sol.finalidade}</td>
                        <td><input type="text" id="motivo-${sol.id}" placeholder="Digite o motivo..." style="margin-bottom: 0;"></td>
                        <td>
                            <button onclick="avaliarRequerimentoAluno(${sol.id}, 'Aprovado')" style="background-color: #27ae60; padding: 5px 10px; font-size: 12px; margin-bottom: 5px; width: 100%;">✔️ Aprovar</button>
                            <button onclick="avaliarRequerimentoAluno(${sol.id}, 'Recusado')" style="background-color: #e74c3c; padding: 5px 10px; font-size: 12px; width: 100%;">❌ Recusar</button>
                        </td>
                    </tr>
                `;
            }
        });
    } catch (error) { console.error("Erro ao carregar solicitações dos alunos"); }
}

// 27. PROFESSOR AVALIA SOLICITAÇÃO DO ALUNO
async function avaliarRequerimentoAluno(id, novoStatus) {
    const motivoInput = document.getElementById(`motivo-${id}`);
    const motivo = motivoInput ? motivoInput.value.trim() : "";

    if (!motivo) {
        alert("O preenchimento do motivo/justificativa é OBRIGATÓRIO para a Diretoria!");
        return;
    }

    try {
        const resposta = await fetch(`http://127.0.0.1:8000/solicitacoes-alunos/${id}/avaliar`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: novoStatus, motivo: motivo })
        });

        if (resposta.ok) {
            alert(`Solicitação avaliada e enviada à Diretoria!`);
            carregarRequerimentosAlunos();
            carregarDropdownReservas(); 
        } else {
            alert("Erro ao processar a avaliação.");
        }
    } catch (error) { alert("Erro de conexão ao avaliar."); }
}

// 28. DASHBOARD DA DIRETORIA (ESTATÍSTICAS)
async function carregarDashboardDiretoria() {
    try {
        const resposta = await fetch('http://127.0.0.1:8000/diretoria/estatisticas');
        const dados = await resposta.json();

        const cardUsuarios = document.getElementById('dash-usuarios');
        const cardAcervo = document.getElementById('dash-acervo');
        const cardPendentes = document.getElementById('dash-pendentes');

        if (cardUsuarios) cardUsuarios.innerText = dados.total_usuarios;
        if (cardAcervo) cardAcervo.innerText = dados.total_equipamentos;
        if (cardPendentes) cardPendentes.innerText = dados.pedidos_pendentes;

        const ctx = document.getElementById('graficoDiretoria');
        if (!ctx) return;

        if (graficoDiretoriaInstancia) {
            graficoDiretoriaInstancia.data.datasets[0].data = [dados.equipamentos_disponiveis, dados.equipamentos_ocupados];
            graficoDiretoriaInstancia.update();
        } else {
            graficoDiretoriaInstancia = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: ['Disponíveis', 'Em Uso / Ocupados'],
                    datasets: [{
                        data: [dados.equipamentos_disponiveis, dados.equipamentos_ocupados],
                        backgroundColor: ['#2ecc71', '#e74c3c'],
                        borderWidth: 1
                    }]
                },
                options: { responsive: true }
            });
        }
    } catch (error) {
        console.error("Erro ao carregar estatísticas da diretoria");
    }
}

// 29. DELETAR ACESSÓRIO (ADICIONADO AQUI: Chamada assíncrona ao FastAPI para remover o item)
async function deletarAcessorio(id) {
    if (!confirm("Tem certeza que deseja excluir este equipamento do estoque? Essa ação não pode ser desfeita.")) return;

    try {
        const response = await fetch(`http://127.0.0.1:8000/acessorios/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            const data = await response.json();
            alert(data.mensagem);
            carregarAcessorios('tabela-compras-acessorios'); 
            carregarDropdownReservas(); 
            carregarDashboardDiretoria(); 
        } else {
            alert("Erro ao excluir equipamento no servidor.");
        }
    } catch (error) {
        console.error("Erro na requisição:", error);
    }
}

setInterval(carregarDashboardDiretoria, 5000);