// Importa o framework Express para criar o servidor
const express = require("express");

// Importa a conexão com o banco de dados
const db = require("./database");

// Importa as rotas dos pedidos
const orderRoutes = require("./routes/orderRoutes");

// Cria a aplicação Express
const app = express();

// Permite que a API receba e interprete JSON no body das requisições
app.use(express.json());

// Define que todas as rotas de pedidos começam com /order
app.use("/order", orderRoutes);

// Define a porta e inicia o servidor
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});