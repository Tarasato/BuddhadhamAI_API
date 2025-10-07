.env
```
DATABASE_URL = "sqlserver://127.0.0.1:1433;initial catalog=DBName;user=Username;password=P4ssw0rd;trustServerCertificate=true;charset=utf8mb4"
conn_str= "mssql+pyodbc://Username:P4ssw0rd@127.0.0.1:1433/DBName?driver=ODBC+Driver+18+for+SQL+Server&TrustServerCertificate=yes"
DB_SERVER = "127.0.0.1"
DB_PORT = "0000"
DB_USER = "Username"
DB_PASSWORD = "P4ssw0rd"
DB_NAME = "DBName"
DB_DRIVER = "ODBC Driver 18 for SQL Server"

API_SERVER = "127.0.0.1"
API_SERVER_PORT = 3000

AI_SERVER = "127.0.0.1"
AI_SERVER_PORT = 0000
```

sqlcmd -S <ServerIP> -U <Username> -P <Password>
  
output   = "../generated/prisma" If you have ยพรหทฟ problems, remove this from schema.prisma
npx prisma migrate reset --force
npx prisma migrate dev --name init

git rm --cached config.json

python buddhamAI_cli.py ""

pip install faiss-cpu
pip install numpy
pip install ollama

#to do list
- API เช็ก task ล่ม
- เช็กคำตอบกลับจาก AI
- บันทึก A ลง DB