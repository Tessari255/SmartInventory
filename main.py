from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import csv
import io
import os
import tempfile
from fpdf import FPDF
import random
from datetime import datetime
import bcrypt 

from database import engine, SessionLocal, Base
import models, schemas

# \\inicializa o software
# py -m uvicorn main:app --reload\\
# Cria as tabelas no banco de dados
Base.metadata.create_all(bind=engine)

app = FastAPI(title="API SmartInventory Acadêmico")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def raiz():
    return {"mensagem": "API do SmartInventory Online!"}


# ROTAS DE USUÁRIOS E LOGIN

@app.post("/login", response_model=schemas.LoginResponse)
def realizar_login(dados: schemas.LoginRequest, db: Session = Depends(get_db)):
    usuario = db.query(models.Usuario).filter(models.Usuario.email == dados.email).first()
    
    if not usuario:
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos")
    
    try:
        senha_valida = bcrypt.checkpw(dados.senha.encode('utf-8'), usuario.senha_hash.encode('utf-8'))
    except ValueError:
        senha_valida = (usuario.senha_hash == dados.senha)

    if not senha_valida:
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos")
        
    return {
        "mensagem": "Login realizado com sucesso!",
        "usuario_id": usuario.id,
        "nome": usuario.nome,
        "perfil": usuario.perfil
    }

@app.post("/usuarios/", response_model=schemas.UsuarioResponse)
def criar_usuario(usuario: schemas.UsuarioCreate, db: Session = Depends(get_db)):
    novo_usuario = models.Usuario(**usuario.dict())
    
    senha_plana = novo_usuario.senha_hash
    novo_usuario.senha_hash = bcrypt.hashpw(senha_plana.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    db.add(novo_usuario)
    db.commit()
    db.refresh(novo_usuario)
    return novo_usuario

@app.post("/upload-usuarios/")
async def upload_usuarios(arquivo: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        conteudo = await arquivo.read()
        
        try:
            texto = conteudo.decode("utf-8")
        except UnicodeDecodeError:
            texto = conteudo.decode("latin-1")
        
        delimitador = ';' if ';' in texto else ','
        f = io.StringIO(texto)
        leitor = csv.reader(f, delimiter=delimitador)
        
        try:
            next(leitor)  
        except StopIteration:
            return {"mensagem": "Arquivo vazio"}

        cadastrados = 0
        ano_atual = datetime.now().year
        
        for linha in leitor:
            if not linha or len(linha) < 2:
                continue
                
            nome_completo = linha[0].strip()
            perfil = linha[1].strip().capitalize() 
            
            partes_nome = nome_completo.lower().split()
            if len(partes_nome) > 1:
                email_gerado = f"{partes_nome[0]}.{partes_nome[-1]}@faculdade.edu.br"
            else:
                email_gerado = f"{partes_nome[0]}@faculdade.edu.br"
            
            matricula_gerada = f"{ano_atual}{random.randint(1000, 9999)}"
            usuario_existe = db.query(models.Usuario).filter(models.Usuario.email == email_gerado).first()
            
            if not usuario_existe:
                senha_padrao_criptografada = bcrypt.hashpw("Mudar@123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                
                novo_user = models.Usuario(
                    nome=nome_completo,
                    matricula=matricula_gerada,
                    email=email_gerado,
                    senha_hash=senha_padrao_criptografada, 
                    perfil=perfil
                )
                db.add(novo_user)
                cadastrados += 1
                
        db.commit()
        return {"mensagem": f"{cadastrados} usuários gerados e cadastrados com sucesso!"}
        
    except Exception as e:
        db.rollback()
        print(f"Erro: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao processar: {str(e)}")

@app.get("/usuarios/")
def listar_usuarios(db: Session = Depends(get_db)):
    try:
        return db.query(models.Usuario).all()
    except Exception as erro:
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(erro)}")

@app.delete("/usuarios/{usuario_id}")
def deletar_usuario(usuario_id: int, db: Session = Depends(get_db)):
    usuario = db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    db.delete(usuario)
    db.commit()
    return {"mensagem": "Usuário removido com sucesso!"}

@app.get("/usuarios/professores")
def listar_professores(db: Session = Depends(get_db)):
    professores = db.query(models.Usuario).filter(models.Usuario.perfil == "Professor").all()
    return [{"id": p.id, "nome": p.nome} for p in professores]


# ACESSÓRIOS, ESTOQUE E SALAS

@app.post("/acessorios/", response_model=schemas.AcessorioResponse)
def criar_acessorio(acessorio: schemas.AcessorioCreate, db: Session = Depends(get_db)):
    novo_item = models.Acessorio(nome=acessorio.nome, codigo_patrimonio=acessorio.codigo_patrimonio, status="Disponível")
    db.add(novo_item)
    db.commit()
    db.refresh(novo_item)
    return novo_item

@app.get("/acessorios/", response_model=List[schemas.AcessorioResponse])
def listar_acessorios(db: Session = Depends(get_db)):
    return db.query(models.Acessorio).all()

# Rota para deletar os acessórios/equipamentos do banco de dados
@app.delete("/acessorios/{acessorio_id}")
def deletar_acessorio(acessorio_id: int, db: Session = Depends(get_db)):
    acessorio = db.query(models.Acessorio).filter(models.Acessorio.id == acessorio_id).first()
    
    if not acessorio:
        raise HTTPException(status_code=404, detail="Equipamento não encontrado")
    
    db.delete(acessorio)
    db.commit()
    return {"mensagem": "Equipamento removido com sucesso!"}

@app.post("/salas/")
def criar_sala(sala: schemas.SalaCreate, db: Session = Depends(get_db)):
    nova_sala = models.Sala(nome=sala.nome, modalidade=sala.modalidade, status="Disponível")
    db.add(nova_sala)
    db.commit()
    return {"mensagem": "Sala cadastrada com sucesso!"}

@app.get("/salas/")
def listar_salas(db: Session = Depends(get_db)):
    return db.query(models.Sala).all()

@app.delete("/salas/{sala_id}")
def deletar_sala(sala_id: int, db: Session = Depends(get_db)):
    sala = db.query(models.Sala).filter(models.Sala.id == sala_id).first()
    if sala:
        db.delete(sala)
        db.commit()
        return {"mensagem": "Sala removida com sucesso!"}
    raise HTTPException(status_code=404, detail="Sala não encontrada")

@app.get("/recursos-disponiveis/")
def listar_recursos_aluno(db: Session = Depends(get_db)):
    acessorios = db.query(models.Acessorio).all()
    salas = db.query(models.Sala).all()
    recursos = []
    for a in acessorios:
        recursos.append({"id": f"A_{a.id}", "nome": a.nome, "tipo": "Equipamento", "modalidade": "Acessório", "status": getattr(a, 'status', 'Disponível')})
    for s in salas:
        recursos.append({"id": f"S_{s.id}", "nome": s.nome, "tipo": "Sala", "modalidade": s.modalidade, "status": getattr(s, 'status', 'Disponível')})
    return recursos


# REQUERIMENTOS, SOLICITAÇÕES E PAINEL DIRETORIA

@app.post("/requerimentos/")
def criar_requerimento(req: schemas.RequerimentoCreate, db: Session = Depends(get_db)):
    novo_req = models.Requerimento(**req.dict(), status="Pendente")
    db.add(novo_req)
    db.commit()
    db.refresh(novo_req)
    return novo_req

@app.get("/requerimentos/")
def listar_requerimentos(db: Session = Depends(get_db)):
    return db.query(models.Requerimento).all()

@app.put("/requerimentos/{req_id}")
def atualizar_requerimento(req_id: int, req_update: schemas.RequerimentoUpdate, db: Session = Depends(get_db)):
    requerimento = db.query(models.Requerimento).filter(models.Requerimento.id == req_id).first()
    if not requerimento:
        raise HTTPException(status_code=404, detail="Requerimento não encontrado")
    
    if req_update.status == "Aprovado" and requerimento.status != "Aprovado":
        ano = datetime.now().year
        num = random.randint(1000, 9999)
        novo_acessorio = models.Acessorio(nome=requerimento.equipamento, codigo_patrimonio=f"PAT-{ano}-{num}", status="Disponível")
        db.add(novo_acessorio)

    requerimento.status = req_update.status
    if req_update.motivo_rejeicao:
        requerimento.motivo_rejeicao = req_update.motivo_rejeicao
        
    db.commit()
    return requerimento

@app.post("/solicitacoes-alunos/")
def criar_solicitacao_aluno(sol: schemas.SolicitacaoAlunoCreate, db: Session = Depends(get_db)):
    recursos_ids = [r.strip() for r in sol.recurso_id.split(",")]
    nomes_recursos = []

    for r_id in recursos_ids:
        if r_id.startswith("A_"):
            item = db.query(models.Acessorio).filter(models.Acessorio.id == int(r_id[2:])).first()
            if item: nomes_recursos.append(item.nome)
        else:
            sala = db.query(models.Sala).filter(models.Sala.id == int(r_id[2:])).first()
            if sala: nomes_recursos.append(sala.nome)

    recurso_nome_final = ", ".join(nomes_recursos)

    professor_nome = None
    if sol.professor_id:
        prof = db.query(models.Usuario).filter(models.Usuario.id == sol.professor_id).first()
        if prof: professor_nome = prof.nome

    nova_sol = models.SolicitacaoAluno(
        aluno=sol.aluno,
        recurso_id_original=sol.recurso_id, 
        recurso_nome=recurso_nome_final, 
        professor_nome=professor_nome,
        finalidade=sol.finalidade,
        status="Pendente",
        motivo_justificativa=""
    )
    db.add(nova_sol)
    db.commit()
    return {"mensagem": "Solicitação enviada ao professor"}

@app.get("/solicitacoes-alunos/professor/{professor_nome}")
def listar_solicitacoes_professor(professor_nome: str, db: Session = Depends(get_db)):
    return db.query(models.SolicitacaoAluno).filter(
        models.SolicitacaoAluno.professor_nome == professor_nome,
    ).all()

@app.put("/solicitacoes-alunos/{id}/avaliar")
def avaliar_solicitacao_aluno(id: int, avaliacao: schemas.AvaliacaoAluno, db: Session = Depends(get_db)):
    sol = db.query(models.SolicitacaoAluno).filter(models.SolicitacaoAluno.id == id).first()
    if not sol:
        raise HTTPException(status_code=404, detail="Solicitação não encontrada")
        
    sol.status = avaliacao.status
    sol.motivo_justificativa = avaliacao.motivo
    
    if avaliacao.status == "Aprovado":
        recursos_ids = [r.strip() for r in sol.recurso_id_original.split(",")]
        for r_id in recursos_ids:
            if r_id.startswith("A_"):
                item = db.query(models.Acessorio).filter(models.Acessorio.id == int(r_id[2:])).first()
                if item: item.status = "Ocupado"
            else:
                sala = db.query(models.Sala).filter(models.Sala.id == int(r_id[2:])).first()
                if sala: sala.status = "Ocupado"
        
        nova_reserva = models.Reserva(
            solicitante=sol.professor_nome,
            equipamento=sol.recurso_nome,
            data_reserva=datetime.now().strftime("%Y-%m-%d"),
            devolvido=False,
            recurso_id_original=sol.recurso_id_original
        )
        db.add(nova_reserva)

    db.commit()
    return {"mensagem": "Avaliação concluída e enviada à Diretoria!"}

@app.get("/diretoria/painel-pedidos")
def painel_pedidos_diretoria(db: Session = Depends(get_db)):
    requerimentos = db.query(models.Requerimento).all()
    solicitacoes = db.query(models.SolicitacaoAluno).all()
    
    painel = []
    for r in requerimentos:
        painel.append({
            "id": r.id,
            "origem": f"Prof. {r.solicitante}",
            "recurso": r.equipamento,
            "professor_responsavel": r.solicitante,
            "motivo_justificativa": r.justificativa,
            "status": r.status,
            "tipo": "Requerimento Professor"
        })
        
    for s in solicitacoes:
        if s.status != "Pendente" or not s.professor_nome:
            painel.append({
                "id": s.id,
                "origem": f"Aluno: {s.aluno}",
                "recurso": s.recurso_nome,
                "professor_responsavel": s.professor_nome,
                "motivo_justificativa": s.motivo_justificativa or s.finalidade,
                "status": s.status,
                "tipo": "Solicitação Aluno"
            })
        
    painel.sort(key=lambda x: (0 if x["status"] == "Pendente" else 1, x["id"]))
    return painel

@app.get("/diretoria/estatisticas")
def estatisticas_diretoria(db: Session = Depends(get_db)):
    total_usuarios = db.query(models.Usuario).count()
    
    total_acessorios = db.query(models.Acessorio).count()
    total_salas = db.query(models.Sala).count()
    acervo_total = total_acessorios + total_salas
    
    acessorios_ocupados = db.query(models.Acessorio).filter(models.Acessorio.status == "Ocupado").count()
    salas_ocupadas = db.query(models.Sala).filter(models.Sala.status == "Ocupado").count()
    total_ocupados = acessorios_ocupados + salas_ocupadas
    
    total_disponiveis = acervo_total - total_ocupados
    
    req_pendentes = db.query(models.Requerimento).filter(models.Requerimento.status == "Pendente").count()
    sol_pendentes = db.query(models.SolicitacaoAluno).filter(models.SolicitacaoAluno.status == "Pendente").count()
    total_pendentes = req_pendentes + sol_pendentes

    return {
        "total_usuarios": total_usuarios,
        "total_equipamentos": acervo_total,
        "equipamentos_disponiveis": total_disponiveis,
        "equipamentos_ocupados": total_ocupados,
        "pedidos_pendentes": total_pendentes
    }

@app.get("/diretoria/corrigir-estoque")
def corrigir_estoque_preso(db: Session = Depends(get_db)):
    acessorios_presos = db.query(models.Acessorio).filter(models.Acessorio.status == "Ocupado").all()
    for a in acessorios_presos:
        a.status = "Disponível"
        
    salas_presas = db.query(models.Sala).filter(models.Sala.status == "Ocupado").all()
    for s in salas_presas:
        s.status = "Disponível"
        
    db.commit()
    return {"mensagem": "Sucesso! O estoque foi resetado. Todos os itens estão Disponíveis."}


# ROTAS DE RESERVAS E PDF

@app.post("/reservas/")
def criar_reserva(reserva: schemas.ReservaCreate, db: Session = Depends(get_db)):
    try:
        equipamentos_lista = [e.strip() for e in reserva.equipamento.split(",")]
        
        for equip in equipamentos_lista:
            item = db.query(models.Acessorio).filter(models.Acessorio.nome == equip).first()
            if item: item.status = "Ocupado"
            
            sala = db.query(models.Sala).filter(models.Sala.nome == equip).first()
            if sala: sala.status = "Ocupado"
        
        nova_reserva = models.Reserva(
            solicitante=reserva.solicitante,
            equipamento=reserva.equipamento, 
            data_reserva=reserva.data_reserva,
            devolvido=False
        )
        db.add(nova_reserva)
        db.commit()
        db.refresh(nova_reserva)
        return nova_reserva
        
    except Exception as erro:
        db.rollback() 
        print(f"ERRO DE BANCO DE DADOS: {erro}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(erro)}")

@app.get("/reservas/")
def listar_reservas(db: Session = Depends(get_db)):
    try:
        return db.query(models.Reserva).all()
    except Exception as erro:
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(erro)}")

@app.get("/gerar-pdf/{reserva_id}")
def gerar_pdf(reserva_id: int, db: Session = Depends(get_db)):
    reserva = db.query(models.Reserva).filter(models.Reserva.id == reserva_id).first()
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva não encontrada")
    
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", 'B', 16)
    pdf.cell(200, 10, text="SmartInventory Academico", ln=1, align="C")
    pdf.set_font("Arial", 'B', 14)
    pdf.cell(200, 10, text="Termo de Responsabilidade e Check-out", ln=1, align="C")
    pdf.ln(10)
    
    pdf.set_font("Arial", size=12)
    pdf.cell(200, 10, text=f"ID da Reserva: {reserva.id}", ln=1)
    pdf.cell(200, 10, text=f"Professor/Solicitante: {reserva.solicitante}", ln=1)
    
    pdf.cell(200, 10, text="Equipamento(s)/Sala(s):", ln=1)
    pdf.multi_cell(0, 10, text=f"{reserva.equipamento}")
    
    pdf.cell(200, 10, text=f"Data de Retirada: {reserva.data_reserva}", ln=1)
    
    pdf.ln(20)
    pdf.cell(200, 10, text="Assinatura do Responsavel: _____________________________________", ln=1)
    
    fd, path = tempfile.mkstemp(suffix=".pdf")
    os.close(fd)
    pdf.output(path)
    return FileResponse(path, media_type='application/pdf', filename=f"termo_reserva_{reserva_id}.pdf")

@app.put("/reservas/{reserva_id}/devolver")
def devolver_reserva(reserva_id: int, db: Session = Depends(get_db)):
    reserva = db.query(models.Reserva).filter(models.Reserva.id == reserva_id).first()
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva não encontrada")
    
    reserva.devolvido = True
    
    if hasattr(reserva, 'recurso_id_original') and reserva.recurso_id_original:
        recursos_ids = [r.strip() for r in reserva.recurso_id_original.split(",")]
        for r_id in recursos_ids:
            if r_id.startswith("A_"):
                item = db.query(models.Acessorio).filter(models.Acessorio.id == int(r_id[2:])).first()
                if item: item.status = "Disponível"
            elif r_id.startswith("S_"):
                sala = db.query(models.Sala).filter(models.Sala.id == int(r_id[2:])).first()
                if sala: sala.status = "Disponível"
    else:
        equipamentos_lista = [e.strip() for e in reserva.equipamento.split(",")]
        for equip in equipamentos_lista:
            item = db.query(models.Acessorio).filter(models.Acessorio.nome == equip).first()
            if item: item.status = "Disponível"
            sala = db.query(models.Sala).filter(models.Sala.nome == equip).first()
            if sala: sala.status = "Disponível"

    db.commit()
    return {"mensagem": "Equipamento/Sala devolvido com sucesso!"}