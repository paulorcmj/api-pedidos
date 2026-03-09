# api-pedidos

API REST para gerenciamento de pedidos, desenvolvida com Node.js, Express e SQLite.

## Tecnologias utilizadas
- Node.js
- Express
- SQLite3

## Como rodar o projeto

### 1. Clone o repositório
git clone https://github.com/paulorcmj/api-pedidos.git

### 2. Instale as dependências
npm install

### 3. Inicie o servidor
npm start

O servidor estará rodando em http://localhost:3000

## Rotas disponíveis

| POST | /order | Criar novo pedido |
| GET | /order/list | Listar todos os pedidos |
| GET | /order/:orderId | Buscar pedido por ID |
| PUT | /order/:orderId | Atualizar pedido |
| DELETE | /order/:orderId | Deletar pedido |

## Exemplo de payload

\`\`\`json
{
  "numeroPedido": "001",
  "valorTotal": 150.00,
  "dataCriacao": "2024-01-01",
  "items": [
    {
      "idItem": "p1",
      "quantidadeItem": 2,
      "valorItem": 75.00
    }
  ]
}
\`\`\`