const { getGoogleSheetsClient } = require('../../utils/getGoogleSheetsClient');

class OrdersService {
  constructor () {
    this.orders = [];
  }
// {
//   idUser:"PLANTA PRODUCCIÓN",
//   deliveryDate: "2024-11-22",
//   orderNotes: "Prueba",
//   products: [{name: 'ATÚN', quantity: '1', totalPrice: 32424},
//   {name: 'AZUCAR BLANCA', quantity: '20', totalPrice: 23421}]
// }
  async create (newOrderData) {
    try {
      const sheetsApi = await getGoogleSheetsClient();
      const spreadsheetId = '1VBk8B9E2uA98Zs3yEqrTl1uFqsRWNVG06LAlqIFazrs';
      const ranges = ["pedido", "pedidoDetalle", "clientes", "product"];

      const sheets = await sheetsApi.spreadsheets.values.batchGet({
        spreadsheetId: spreadsheetId,
        ranges: ranges,
      });

      const orderSheetRows = sheets.data.valueRanges[0].values;
      const orderDetailsSheetRows = sheets.data.valueRanges[1].values;
      const customersSheetRows = sheets.data.valueRanges[2].values;
      const productsSheetRows = sheets.data.valueRanges[3].values;

      let orderNextId = orderSheetRows.length === 1 ? 1 : (orderSheetRows.length - 1) + 1;

     ;

      customersSheetRows.shift();
      let idCustomer = customersSheetRows.find(row => row[1] === newOrderData.idUser)[0];

      const date = () => {
        const now = new Date();
        // Convertir a hora de Colombia (UTC-5)
        const colombiaTime = new Date(now.getTime() - (5 * 60 * 60 * 1000));

        // Formatear la fecha y hora
        const year = colombiaTime.getUTCFullYear();
        const month = String(colombiaTime.getUTCMonth() + 1).padStart(2, '0');
        const day = String(colombiaTime.getUTCDate()).padStart(2, '0');
        const hours = String(colombiaTime.getUTCHours()).padStart(2, '0');
        const minutes = String(colombiaTime.getUTCMinutes()).padStart(2, '0');

        // Crear string formateado
        const timestamp = `${year}-${month}-${day} ${hours}:${minutes}`;

        return timestamp;
      }

      let orderDetailsNextId = orderDetailsSheetRows.length === 1 ? 1 : (orderDetailsSheetRows.length - 1) + 1;

      //lista de cada de todos los registros de un solo pedido en pedidoDetalle
      const orderDetailsList = [];

      // se va a comparar nombre con nombre de producto. Luego tienes que cambiarlo a comprobar por idProduct
      let netCost = 0;
      let surcharge;
      let surchargedPrice = 0;
      newOrderData.products.forEach(element => {
        const productRow = productsSheetRows.find(row => row[1] === element.name);

        const totalPrice = parseInt(element.quantity) * parseInt(productRow[4]);
        netCost += totalPrice;
        surcharge = (netCost * 15) / 100;


        if (orderDetailsList.length === 0) {
          const orderDetails = [
            orderDetailsNextId,
            orderNextId,
            productRow[0],
            element.quantity,
            productRow[4],
            totalPrice,
          ];
          orderDetailsList.push(orderDetails);
        } else if (orderDetailsList.length > 0) {

          const orderDetails = [
            (orderDetailsNextId + orderDetailsList.length),// recalcula el siguiente idOrderDetail
            orderNextId,
            productRow[0],
            element.quantity,
            productRow[4],
            totalPrice,
          ];
          orderDetailsList.push(orderDetails);
        }
      });

      surchargedPrice = surcharge + netCost;

      const newOrder = {
        range: ranges[0],
        values: [[
          orderNextId,
          idCustomer,
          date(),
          newOrderData.deliveryDate,
          "pendiente",
          newOrderData.orderNotes,
          netCost,
          surcharge,
          surchargedPrice,
        ]]
      }

      const orderDetailsRegistrations = {
        range: ranges[1],
        values: orderDetailsList
      }
      const orderResponse = await sheetsApi.spreadsheets.values.append({
        spreadsheetId: spreadsheetId,
        range: newOrder.range,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: newOrder.values,
        },
      });

      if (orderResponse.statusText === "OK") {
        await sheetsApi.spreadsheets.values.append({
          spreadsheetId: spreadsheetId,
          range: orderDetailsRegistrations.range,
          valueInputOption: 'RAW',
          insertDataOption: 'INSERT_ROWS',
          requestBody: {
            values: orderDetailsRegistrations.values,
          },
        });
      }

      const orderSheetResponse = JSON.parse(orderResponse.config.body).values[0];

      return {
        success: true,
        message: 'Datos guardados correctamente',
        savedData: {
          idOrder: orderSheetResponse[0],
          idUser: orderSheetResponse[1],
          orderDate: orderSheetResponse[2],
          deliveryDate: orderSheetResponse[3],
          status: orderSheetResponse[4],
          orderNotes: orderSheetResponse[5],
          netCost:orderSheetResponse[6],
          surcharge: orderSheetResponse[7],
          surchargedPrice: orderSheetResponse[8]
        },
      }
    } catch (error) {
      return {
        success: false,
        message: 'Error al agregar las filas',
        error: error.message,
      };
    }

  }
}

module.exports = OrdersService;
