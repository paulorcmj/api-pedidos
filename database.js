const sqlite3 = require("sqlite3").verbose();

// Cria ou abre o banco de dados SQLite no arquivo pedidos.db
const db = new sqlite3.Database("pedidos.db", (err) => {
  if (err) {
    console.error("Erro ao conectar ao banco de dados:", err.message);
  } else {
    console.log("Conectado ao banco de dados SQLite.");
  }
});

// Cria as tabelas caso ainda não existam
db.serialize(() => {
  // Tabela principal de pedidos
  db.run(`
    CREATE TABLE IF NOT EXISTS "Order" (
      orderId TEXT PRIMARY KEY, value REAL NOT NULL, creationDate TEXT NOT NULL
    )
  `);

  // Tabela de itens vinculados a cada pedido
  db.run(`
    CREATE TABLE IF NOT EXISTS Items (
      id INTEGER PRIMARY KEY AUTOINCREMENT, orderId TEXT NOT NULL, productId TEXT NOT NULL, quantity INTEGER NOT NULL, price REAL NOT NULL, FOREIGN KEY (orderId) REFERENCES "Order"(orderId)
    )
  `);
});

module.exports = db;