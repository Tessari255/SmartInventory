🚀 SmartInventory Acadêmico
O SmartInventory Acadêmico é uma solução robusta para gestão de ativos, reservas de salas e controle de estoque em ambientes educacionais. Desenvolvido com uma arquitetura moderna que separa o front-end dinâmico de uma API de alta performance em Python.

🛠️ Tecnologias e Arquitetura
O projeto utiliza o que há de mais moderno no ecossistema Python e Desenvolvimento Web:


Back-end: FastAPI (API de alto desempenho com tipagem estática).

ORM / Banco de Dados: SQLAlchemy integrado com PostgreSQL para persistência de dados relacional.

Front-end: HTML5, CSS3 e JavaScript (Vanilla) com integração via Fetch API.

Dashboard Visual: Chart.js para monitoramento em tempo real da ocupação do laboratório.


Relatórios: Geração automática de Termos de Responsabilidade em PDF usando a biblioteca FPDF.

📋 Funcionalidades Principais
1. Sistema de Perfis (RBAC)
O sistema adapta a interface automaticamente dependendo do perfil do usuário logado:

Professor: Realiza reservas de equipamentos/salas e solicita novos itens.

Aluno: Consulta disponibilidade e solicita reservas para estudo.

Administrador (Compras/TI): Gerencia o estoque, avalia requerimentos e gerencia usuários via CSV.

2. Gestão de Reservas e Check-out
Monitoramento em Tempo Real: O dashboard atualiza automaticamente a cada 5 segundos.

Gráfico de Ocupação: Visualização tipo Doughnut da taxa de uso dos equipamentos.

Termo de Responsabilidade: Geração de PDF oficial com dados da reserva para assinatura.

3. Automação e Segurança
Backup Automático: Script dedicado (backup.py) que realiza dumps do banco de dados PostgreSQL a cada hora.

Importação em Lote: Cadastro de turmas inteiras através de arquivos CSV.

Geração de Patrimônio: Criação automática de códigos de identificação (PAT-ANO-XXXX).

🏗️ Estrutura do Código

main.py: Ponto de entrada da API com todas as rotas REST.

models.py: Definição das tabelas do banco de dados (Usuários, Acessórios, Requerimentos, Reservas).


schemas.py: Validação de dados e tipos usando Pydantic.

login.js: Lógica de front-end, manipulação de DOM e integração com a API.

🚀 Como Executar
Requisitos: Python 3.10+ e PostgreSQL instalado.

Instalação:

Bash
pip install -r requirements.txt
Configuração: Ajuste a URL do banco em database.py.

Rodar a API:

Bash
uvicorn main:app --reload
Acesso: Abra o index.html no seu navegador.
