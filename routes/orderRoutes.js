const express = require("express");
const router = express.Router();
const db = require("../database");
const { mapearPedido } = require("../mapping");

// POST /order - Criar um novo pedido
router.post("/", (req, res) => {
  // Faz o mapping dos campos recebidos para o formato do banco
  const pedidoMapeado = mapearPedido(req.body);

  // Insere o pedido na tabela Order
  db.run(
    `INSERT INTO "Order" (orderId, value, creationDate) VALUES (?, ?, ?)`,
    [pedidoMapeado.orderId, pedidoMapeado.value, pedidoMapeado.creationDate],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      // Prepara a inserção dos itens na tabela Items
      const insertItem = db.prepare(
        `INSERT INTO Items (orderId, productId, quantity, price) VALUES (?, ?, ?, ?)`
      );

      // Insere cada item vinculado ao pedido
      pedidoMapeado.items.forEach((item) => {
        insertItem.run([pedidoMapeado.orderId, item.productId, item.quantity, item.price]);
      });

      insertItem.finalize();
      res.status(201).json({ message: "Pedido criado com sucesso!", orderId: pedidoMapeado.orderId });
    }
  );
});

// GET /order/list - Listar todos os pedidos
router.get("/list", (req, res) => {
  // Busca todos os pedidos na tabela Order
  db.all(`SELECT * FROM "Order"`, [], (err, orders) => {
    if (err) return res.status(500).json({ error: err.message });

    const result = [];
    let pending = orders.length;

    // Retorna lista vazia se não houver pedidos
    if (pending === 0) return res.status(200).json([]);

    // Para cada pedido, busca os itens correspondentes
    orders.forEach((order) => {
      db.all(`SELECT * FROM Items WHERE orderId = ?`, [order.orderId], (err, items) => {
        if (err) return res.status(500).json({ error: err.message });
        result.push({ ...order, items });
        if (--pending === 0) res.status(200).json(result);
      });
    });
  });
});

// GET /order/:orderId - Obter pedido por número
router.get("/:orderId", (req, res) => {
  const { orderId } = req.params;

  // Busca o pedido pelo orderId
  db.get(`SELECT * FROM "Order" WHERE orderId = ?`, [orderId], (err, order) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!order) return res.status(404).json({ error: "Pedido não encontrado." });

    // Busca os itens do pedido
    db.all(`SELECT * FROM Items WHERE orderId = ?`, [orderId], (err, items) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(200).json({ ...order, items });
    });
  });
});

// PUT /order/:orderId - Atualizar pedido
router.put("/:orderId", (req, res) => {
  const { orderId } = req.params;
  const pedidoMapeado = mapearPedido(req.body);

  // Verifica se o pedido existe antes de atualizar
  db.get(`SELECT * FROM "Order" WHERE orderId = ?`, [orderId], (err, order) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!order) return res.status(404).json({ error: "Pedido não encontrado." });

    // Atualiza os dados do pedido
    db.run(
      `UPDATE "Order" SET value = ?, creationDate = ? WHERE orderId = ?`,
      [pedidoMapeado.value, pedidoMapeado.creationDate, orderId],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });

        // Remove os itens antigos e insere os novos
        db.run(`DELETE FROM Items WHERE orderId = ?`, [orderId], function (err) {
          if (err) return res.status(500).json({ error: err.message });

          const insertItem = db.prepare(
            `INSERT INTO Items (orderId, productId, quantity, price) VALUES (?, ?, ?, ?)`
          );

          pedidoMapeado.items.forEach((item) => {
            insertItem.run([orderId, item.productId, item.quantity, item.price]);
          });

          insertItem.finalize();
          res.status(200).json({ message: "Pedido atualizado com sucesso!" });
        });
      }
    );
  });
});

// DELETE /order/:orderId - Deletar pedido
router.delete("/:orderId", (req, res) => {
  const { orderId } = req.params;

  // Verifica se o pedido existe antes de deletar
  db.get(`SELECT * FROM "Order" WHERE orderId = ?`, [orderId], (err, order) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!order) return res.status(404).json({ error: "Pedido não encontrado." });

    // Deleta os itens do pedido primeiro
    db.run(`DELETE FROM Items WHERE orderId = ?`, [orderId], function (err) {
      if (err) return res.status(500).json({ error: err.message });

      // Depois deleta o pedido
      db.run(`DELETE FROM "Order" WHERE orderId = ?`, [orderId], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: "Pedido deletado com sucesso!" });
      });
    });
  });
});

module.exports = router;