import os
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv

# Carrega as variáveis do arquivo .env se ele existir
load_dotenv()

# Configurações de Segurança
SECRET_KEY = os.getenv("SECRET_KEY", "9a15f83ceab90efbdf087b7415494191c95029be9752b9049ad8be7cb992e9bf")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

# Configuração do Banco de Dados
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:Ttrs7654@127.0.0.1:5432/smartinventory")

# Caminho do pg_dump para Backups
PG_DUMP_PATH = os.getenv("PG_DUMP_PATH", r"C:\Program Files\PostgreSQL\18\bin\pg_dump.exe")
