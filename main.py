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

from database import engine, SessionLocal, Base
import models, schemas
import random
from datetime import datetime

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

# ==========================================
# ROTAS DE USUÁRIOS E LOGIN
# ==========================================
@app.post("/login", response_model=schemas.LoginResponse)
def realizar_login(dados: schemas.LoginRequest, db: Session = Depends(get_db)):
    usuario = db.query(models.Usuario).filter(models.Usuario.email == dados.email).first()
    if not usuario or usuario.senha_hash != dados.senha:
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
    db.add(novo_usuario)
    db.commit()
    db.refresh(novo_usuario)
    return novo_usuario

@app.post("/upload-usuarios/")
async def upload_usuarios(arquivo: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        conteudo = await arquivo.read()
        texto = conteudo.decode("utf-8")
        
        # Truque: Descobre sozinho se o arquivo usa vírgula ou ponto e vírgula
        delimitador = ';' if ';' in texto else ','
        leitor = csv.reader(io.StringIO(texto), delimiter=delimitador)
        next(leitor)  # Pula o cabeçalho do CSV
        
        cadastrados = 0
        for linha in leitor:
            if len(linha) >= 5:
                novo_user = models.Usuario(
                    nome=linha[0].strip(),
                    matricula=linha[1].strip(),
                    email=linha[2].strip(),
                    senha_hash=linha[3].strip(),
                    perfil=linha[4].strip()
                )
                db.add(novo_user)
                cadastrados += 1
                
        db.commit()
        return {"mensagem": f"{cadastrados} usuários cadastrados com sucesso via CSV!"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao processar arquivo: {str(e)}")

# acessorios e estoque
@app.post("/acessorios/", response_model=schemas.AcessorioResponse)
def criar_acessorio(acessorio: schemas.AcessorioCreate, db: Session = Depends(get_db)):
    novo_item = models.Acessorio(nome=acessorio.nome, codigo_patrimonio=acessorio.codigo_patrimonio)
    db.add(novo_item)
    db.commit()
    db.refresh(novo_item)
    return novo_item

@app.get("/acessorios/", response_model=List[schemas.AcessorioResponse])
def listar_acessorios(db: Session = Depends(get_db)):
    return db.query(models.Acessorio).all()

# requerimentos 
@app.post("/requerimentos/")
def criar_requerimento(req: schemas.RequerimentoCreate, db: Session = Depends(get_db)):
    novo_req = models.Requerimento(**req.dict())
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
        novo_acessorio = models.Acessorio(nome=requerimento.equipamento, codigo_patrimonio=f"PAT-{ano}-{num}")
        db.add(novo_acessorio)

    requerimento.status = req_update.status
    if req_update.motivo_rejeicao:
        requerimento.motivo_rejeicao = req_update.motivo_rejeicao
        
    db.commit()
    return requerimento

# ==========================================
# ROTAS DE RESERVAS E PDF
# ==========================================
@app.post("/reservas/")
def criar_reserva(reserva: schemas.ReservaCreate, db: Session = Depends(get_db)):
    try:
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
    pdf.cell(200, 10, txt="SmartInventory Academico", ln=True, align="C")
    pdf.set_font("Arial", 'B', 14)
    pdf.cell(200, 10, txt="Termo de Responsabilidade e Check-out", ln=True, align="C")
    pdf.ln(10)
    
    pdf.set_font("Arial", size=12)
    pdf.cell(200, 10, txt=f"ID da Reserva: {reserva.id}", ln=True)
    pdf.cell(200, 10, txt=f"Professor/Solicitante: {reserva.solicitante}", ln=True)
    pdf.cell(200, 10, txt=f"Equipamento/Sala: {reserva.equipamento}", ln=True)
    pdf.cell(200, 10, txt=f"Data de Retirada: {reserva.data_reserva}", ln=True)
    
    pdf.ln(20)
    pdf.cell(200, 10, txt="Assinatura do Responsavel: _____________________________________", ln=True)
    
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
    db.commit()
    return {"mensagem": "Equipamento/Sala devolvido"}
# ROTAS DE USUÁRIOS (LISTAGEM)
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