import os
import time
from datetime import datetime
import subprocess  

# CONFIGURAÇÕES DO BANCO DE DADOS 
DB_USER = "postgres"
DB_PASS = "Ttrs7654"          
DB_NAME = "smartinventory"    

def realizar_backup():
    if not os.path.exists("backups"):
        os.makedirs("backups")

    data_hora = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    nome_arquivo = f"backups/backup_{data_hora}.sql"


    CAMINHO_PGDUMP = r"C:\Program Files\PostgreSQL\18\bin\pg_dump.exe"
    URL_CONEXAO = f"postgresql://{DB_USER}:{DB_PASS}@localhost:5432/{DB_NAME}"
    
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Iniciando backup automático...")
    
    try:
        
        subprocess.run([CAMINHO_PGDUMP, URL_CONEXAO, "-f", nome_arquivo], check=True)
        print(f" Backup concluído! Arquivo salvo em: {nome_arquivo}\n")
        
    except FileNotFoundError:
        print(" Erro: O arquivo pg_dump.exe não foi encontrado na pasta '18'.\n")
    except subprocess.CalledProcessError as e:
        print(f" Erro ao realizar o backup: {e}\n")

print("Serviço de Backup Iniciado (Intervalo: 1 hora)")

while True:
    realizar_backup()
    time.sleep(3600)