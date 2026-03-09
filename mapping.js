// Faz o mapping do JSON recebido para o formato do banco de dados
// Transforma os campos em português para o padrão em inglês
function mapearPedido(body) {
  return {
    orderId: body.numeroPedido,       // numeroPedido → orderId
    value: body.valorTotal,           // valorTotal → value
    creationDate: new Date(body.dataCriacao).toISOString(), // dataCriacao → creationDate
    items: body.items.map((item) => ({
      productId: item.idItem,         // idItem → productId
      quantity: item.quantidadeItem,  // quantidadeItem → quantity
      price: item.valorItem,          // valorItem → price
    })),
  };
}

module.exports = { mapearPedido };