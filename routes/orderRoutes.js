const express = require("express");
const router = express.Router();
const db = require("../database");
const { mapearPedido } = require("../mapping");

/**
 * @swagger
 * components:
 *   schemas:
 *     Item:
 *       type: object
 *       properties:
 *         idItem:
 *           type: string
 *         quantidadeItem:
 *           type: integer
 *         valorItem:
 *           type: number
 *     Pedido:
 *       type: object
 *       properties:
 *         numeroPedido:
 *           type: string
 *         valorTotal:
 *           type: number
 *         dataCriacao:
 *           type: string
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Item'
 */

/**
 * @swagger
 * /order:
 *   post:
 *     summary: Criar um novo pedido
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Pedido'
 *     responses:
 *       201:
 *         description: Pedido criado com sucesso
 *       500:
 *         description: Erro interno
 */
router.post("/", (req, res) => {
  const pedidoMapeado = mapearPedido(req.body);

  db.run(
    `INSERT INTO "Order" (orderId, value, creationDate) VALUES (?, ?, ?)`,
    [pedidoMapeado.orderId, pedidoMapeado.value, pedidoMapeado.creationDate],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      const insertItem = db.prepare(
        `INSERT INTO Items (orderId, productId, quantity, price) VALUES (?, ?, ?, ?)`
      );

      pedidoMapeado.items.forEach((item) => {
        insertItem.run([pedidoMapeado.orderId, item.productId, item.quantity, item.price]);
      });

      insertItem.finalize();
      res.status(201).json({ message: "Pedido criado com sucesso!", orderId: pedidoMapeado.orderId });
    }
  );
});

/**
 * @swagger
 * /order/list:
 *   get:
 *     summary: Listar todos os pedidos
 *     responses:
 *       200:
 *         description: Lista de pedidos
 *       500:
 *         description: Erro interno
 */
router.get("/list", (req, res) => {
  db.all(`SELECT * FROM "Order"`, [], (err, orders) => {
    if (err) return res.status(500).json({ error: err.message });

    const result = [];
    let pending = orders.length;

    if (pending === 0) return res.status(200).json([]);

    orders.forEach((order) => {
      db.all(`SELECT * FROM Items WHERE orderId = ?`, [order.orderId], (err, items) => {
        if (err) return res.status(500).json({ error: err.message });
        result.push({ ...order, items });
        if (--pending === 0) res.status(200).json(result);
      });
    });
  });
});

/**
 * @swagger
 * /order/{orderId}:
 *   get:
 *     summary: Buscar pedido por ID
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pedido encontrado
 *       404:
 *         description: Pedido não encontrado
 *       500:
 *         description: Erro interno
 */
router.get("/:orderId", (req, res) => {
  const { orderId } = req.params;

  db.get(`SELECT * FROM "Order" WHERE orderId = ?`, [orderId], (err, order) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!order) return res.status(404).json({ error: "Pedido não encontrado." });

    db.all(`SELECT * FROM Items WHERE orderId = ?`, [orderId], (err, items) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(200).json({ ...order, items });
    });
  });
});

/**
 * @swagger
 * /order/{orderId}:
 *   put:
 *     summary: Atualizar pedido
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Pedido'
 *     responses:
 *       200:
 *         description: Pedido atualizado com sucesso
 *       404:
 *         description: Pedido não encontrado
 *       500:
 *         description: Erro interno
 */
router.put("/:orderId", (req, res) => {
  const { orderId } = req.params;
  const pedidoMapeado = mapearPedido(req.body);

  db.get(`SELECT * FROM "Order" WHERE orderId = ?`, [orderId], (err, order) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!order) return res.status(404).json({ error: "Pedido não encontrado." });

    db.run(
      `UPDATE "Order" SET value = ?, creationDate = ? WHERE orderId = ?`,
      [pedidoMapeado.value, pedidoMapeado.creationDate, orderId],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });

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

/**
 * @swagger
 * /order/{orderId}:
 *   delete:
 *     summary: Deletar pedido
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pedido deletado com sucesso
 *       404:
 *         description: Pedido não encontrado
 *       500:
 *         description: Erro interno
 */
router.delete("/:orderId", (req, res) => {
  const { orderId } = req.params;

  db.get(`SELECT * FROM "Order" WHERE orderId = ?`, [orderId], (err, order) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!order) return res.status(404).json({ error: "Pedido não encontrado." });

    db.run(`DELETE FROM Items WHERE orderId = ?`, [orderId], function (err) {
      if (err) return res.status(500).json({ error: err.message });

      db.run(`DELETE FROM "Order" WHERE orderId = ?`, [orderId], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: "Pedido deletado com sucesso!" });
      });
    });
  });
});

module.exports = router;