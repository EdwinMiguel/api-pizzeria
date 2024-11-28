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
      const ranges = ["pedido", "pedidoDetalle", "user", "product"];
      const sheets = await sheetsApi.spreadsheets.values.batchGet({
        spreadsheetId: spreadsheetId,
        ranges: ranges,
      });

      const orderSheetRows = sheets.data.valueRanges[0].values;
      const orderDetailsSheetRows = sheets.data.valueRanges[1].values;
      const customersSheetRows = sheets.data.valueRanges[2].values;
      const productsSheetRows = sheets.data.valueRanges[3].values;

      let orderNextId = orderSheetRows.length === 1 ? 1 : (orderSheetRows.length - 1) + 1;

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
        const productRow = productsSheetRows.find(row => row[1].trim() === element.name.trim());

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

  async find () {
    try {
      const sheetsApi = await getGoogleSheetsClient();
      const spreadsheetId = '1VBk8B9E2uA98Zs3yEqrTl1uFqsRWNVG06LAlqIFazrs';
      const ranges = ["pedido", "pedidoDetalle", "product", "user"];

      const response = await sheetsApi.spreadsheets.values.batchGet({
        spreadsheetId: spreadsheetId,
        ranges: ranges,
      });
      const ordersList = [];

      const ordersSheetRows = response.data.valueRanges[0].values;
      const ordersDetailsSheetRows = response.data.valueRanges[1].values;
      const productSheetRows = response.data.valueRanges[2].values;
      const userSheetRows = response.data.valueRanges[3].values;

      ordersSheetRows.shift();
      ordersSheetRows.forEach(order => {
        const orderFinded = {
          products: []
        }

        orderFinded.idOrder = order[0];
        const user = userSheetRows.find(user => user[0] === order[1]);
        orderFinded.user = user[1];
        orderFinded.orderDate = order[2];
        orderFinded.deliveryDate = order[3];
        orderFinded.status = order[4];
        orderFinded.orderNotes = order[5];
        orderFinded.netCost = order[6];
        if (order[7].includes(",")) {
          orderFinded.surcharge = order[7].replace(',', '.');
        } else if (!order[7].includes(",")) {
          orderFinded.surcharge = order[7];
        }
        if (order[8].includes(",")) {
          orderFinded.surchargedPrice = order[8].replace(',', '.');
        }else if (!order[8].includes(",")) {
          orderFinded.surchargedPrice = order[8];
        }


        const orderDetailsFinded = ordersDetailsSheetRows.filter(row => row[1] === order[0]);
        const orderDetailsToObject = orderDetailsFinded.map(orderDetailsRow => {
          const productFinded = productSheetRows.find(product => product[0] === orderDetailsRow[2]);
          return {
            idProduct: productFinded[0],
            name: productFinded[1],
            quantity: parseInt(orderDetailsRow[3]),
            unitPrice: parseInt(orderDetailsRow[4]),
            totalPrice: parseInt(orderDetailsRow[5]),
          }
        });

        orderFinded.products = orderDetailsToObject;
        ordersList.push(orderFinded);
      });
      this.products = ordersList;
      return this.products;
      // {
      //   idOrder: '1',
      //   idUser: '1',
      //   orderDate: '2024-11-19 00:04',
      //   deliveryDate:  '2024-11-22',
      //   status: 'pendiente',
      //   orderNotes: 'Prueba',
      //   netCost: 187100,
      //   surcharge: 28065,
      //   surchargedPrice: 215165,
      //   products: [
      //     {
      //       name: 'nombre del producto',
      //       quantity: 3,
      //       unitPrice: 5500,
      //       totalPrice: 16500
      //     },
      //   ]
      // }
    } catch (error) {
      console.log(error);
    }


  }

  async update(id, orderChanges) {
    console.log(id, orderChanges);
    try {
      const sheetsApi = await getGoogleSheetsClient();
      const spreadsheetId = '1VBk8B9E2uA98Zs3yEqrTl1uFqsRWNVG06LAlqIFazrs';
      const ranges = ["pedido", "pedidoDetalle", "product"];

      const response = await sheetsApi.spreadsheets.values.batchGet({
        spreadsheetId: spreadsheetId,
        ranges: ranges,
      });

      const ordersSheetRows = response.data.valueRanges[0].values;
      const ordersDetailsSheetRows = response.data.valueRanges[1].values;
      const productSheetRows = response.data.valueRanges[2].values;


      if (orderChanges.deletedProducts.length > 0) {
        const productsToDelete = [...orderChanges.deletedProducts]
        const orderDetailsRegistrations = [];
        productsToDelete.forEach(product => {
          ordersDetailsSheetRows.forEach((row, rowIndex)=> {
            if (row[1] === id.id && row[2] === product.idProduct) {
              console.log(row);
              row[1] = "deleted"
              row[5] = "deleted"
              orderDetailsRegistrations.push(
              {
                updateCells: {
                    range: {
                        sheetId: 1301384339, // Cambia este valor al ID de tu hoja (puedes obtenerlo con `spreadsheets.get`)
                        startRowIndex: rowIndex,
                        endRowIndex: rowIndex + 1,
                        startColumnIndex: 0, // Primera columna
                        endColumnIndex: 6, // Última columna (exclusiva)
                    },
                    rows: [
                        {
                            values: [
                                { userEnteredValue: { stringValue: row[0] } },
                                { userEnteredValue: { stringValue: row[1] } },
                                { userEnteredValue: { stringValue: row[2] } },
                                { userEnteredValue: { stringValue: row[3] } },
                                { userEnteredValue: { stringValue: row[4] } },
                                { userEnteredValue: { stringValue: row[5] } },
                            ],
                        },
                    ],
                    fields: "*",
                },
            });
            }
          });
        })

        const orderDetailsResponse = await sheetsApi.spreadsheets.batchUpdate({
          spreadsheetId,
          resource: { requests: orderDetailsRegistrations },
        });
        }

        if (orderChanges.productsToUpdate.length > 0) {

          const range = 'pedidoDetalle!A:F'
          const orderDetailSheet = await sheetsApi.spreadsheets.values.get({
            // ID del libro
            spreadsheetId: spreadsheetId,
            // ID de la hoja
            range: range
          });


          const updatedRows = []
          // const request = {
          //   updateCells: {
          //       range: {
          //           sheetId: 1301384339, // Cambia este valor al ID de tu hoja (puedes obtenerlo con `spreadsheets.get`)
          //           startRowIndex: rowIndex,
          //           endRowIndex: rowIndex + 1,
          //           startColumnIndex: 0, // Primera columna
          //           endColumnIndex: 6, // Última columna (exclusiva)
          //       },
          //       rows: [
          //           {
          //               values: [
          //                   { userEnteredValue: { numberValue: row[0] } },
          //                   { userEnteredValue: { numberValue: row[1] } },
          //                   { userEnteredValue: { numberValue: row[2] } },
          //                   { userEnteredValue: { numberValue: element.quantity } },
          //                   { userEnteredValue: { numberValue: element.unitPrice } },
          //                   { userEnteredValue: { numberValue: finalCost } },
          //               ],
          //           },
          //       ],
          //       fields: "*",
          //   },
          // }

          const data = orderDetailSheet.data.values;

          data.forEach((row, rowIndex)=> {
            if (row[1] === id.id) {
              orderChanges.productsToUpdate.forEach(element => {
                if (element.idProduct === row[2]) {
                  const totalNetCost = element.unitPrice * element.quantity;
                  const surcharge = (totalNetCost * 15) / 100;
                  const finalCost = surcharge + totalNetCost;
                  const request = {
                    updateCells: {
                        range: {
                            sheetId: 1301384339, // Cambia este valor al ID de tu hoja (puedes obtenerlo con `spreadsheets.get`)
                            startRowIndex: rowIndex,
                            endRowIndex: rowIndex + 1,
                            startColumnIndex: 0, // Primera columna
                            endColumnIndex: 6, // Última columna (exclusiva)
                        },
                        rows: [
                            {
                                values: [
                                    { userEnteredValue: { stringValue: row[0] } },
                                    { userEnteredValue: { stringValue: row[1] } },
                                    { userEnteredValue: { stringValue: row[2] } },
                                    { userEnteredValue: { numberValue: element.quantity } },
                                    { userEnteredValue: { numberValue: element.unitPrice } },
                                    { userEnteredValue: { numberValue: finalCost } },
                                ],
                            },
                        ],
                        fields: "*",
                    },
                  }
                  updatedRows.push(request);
                }
              })
            }
          });

          const response = await sheetsApi.spreadsheets.batchUpdate({
            spreadsheetId,
            resource: { requests: updatedRows },
          });

        }
        const orderDetailsRange = 'pedidoDetalle!A:F'
        const orderDetailSheetUpdated = await sheetsApi.spreadsheets.values.get({
          // ID del libro
          spreadsheetId: spreadsheetId,
          // ID de la hoja
          range: orderDetailsRange
        });
        let rowToUpdate;
        let orderToUpdate;
        ordersSheetRows.forEach((row, index) => {
          if (row[0] === id.id) {
            rowToUpdate = `pedido!A${index + 1}:I${index + 1}`;
            let productsNetCosts = 0;

            const orderDetails = orderDetailSheetUpdated.data.values.filter(element => {
              if (element[1] === row[0]) {
                return element;
              }
            });
            orderDetails.forEach(element => {
              const calculateNetCost = parseInt(element[3]) * parseInt(element[4]);
              productsNetCosts += calculateNetCost;
            })

            const surcharge = (productsNetCosts * 15) / 100;
            const finalCost = surcharge + productsNetCosts;

            orderToUpdate = [row[0], row[1], row[2], row[3], row[4], row[5], productsNetCosts, surcharge ,finalCost];
          }
        });

        const orderSheetResponse = await sheetsApi.spreadsheets.values.update({
          spreadsheetId: spreadsheetId,
          range: rowToUpdate, // Ejemplo: 'Hoja1!A5:F5'
          valueInputOption: 'USER_ENTERED', // Puede ser 'RAW' o 'USER_ENTERED'
          requestBody: {
              values: [orderToUpdate], // Los datos que reemplazarán la fila
          },
        });

        const orderUpdated = JSON.parse(orderSheetResponse.config.body).values[0];
        console.log(orderUpdated);
        if (orderSheetResponse.statusText === "OK") {
          return {
            success: true,
            message: 'Datos actualizados correctamente.',
            idOrder: orderUpdated[0],
          }
        }
    } catch (error) {
      console.log(error);
    }

  }

  async updateStatus(id, status) {
    try {
      const sheetsApi = await getGoogleSheetsClient();
      const spreadsheetId = '1VBk8B9E2uA98Zs3yEqrTl1uFqsRWNVG06LAlqIFazrs';
      const ranges = ["pedido", "pedidoDetalle", "product", "inventory!A:G"];

      const response = await sheetsApi.spreadsheets.values.batchGet({
        spreadsheetId: spreadsheetId,
        ranges: ranges,
      });

      const ordersSheetRows = response.data.valueRanges[0].values;
      const ordersDetailsSheetRows = response.data.valueRanges[1].values;
      const inventorySheetRows = response.data.valueRanges[3].values;
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

      if (status === 'entregado') {
        const order = ordersSheetRows.filter(order => order[0] === id);


        const orderDetails = ordersDetailsSheetRows.filter(row => row[1] === id);

        let inventoryNextId = inventorySheetRows.length === 1 ? 1 : (inventorySheetRows.length - 1) + 1;

        const productsShipped = [];
        const shippedProductsData = {
          range: ranges[3],
          values: productsShipped,
        };
        orderDetails.forEach(element => {
          if (productsShipped.length === 0) {
            productsShipped.push([inventoryNextId, element[2], element[3], 'salida', date(), element[1], '']);
          } else if (productsShipped.length > 0) {
            inventoryNextId += 1;
            productsShipped.push([inventoryNextId, element[2], element[3], 'salida', date(), element[1], '']);
          }
        });

        const savedRegistrations = await sheetsApi.spreadsheets.values.append({
          spreadsheetId: spreadsheetId,
          range: shippedProductsData.range,
          valueInputOption: 'RAW',
          insertDataOption: 'INSERT_ROWS',
          requestBody: {
            values: shippedProductsData.values,
          },
        });

        if (savedRegistrations.statusText === "OK") {
          const orderChangesData = {
          }

          const orderIndex = ordersSheetRows.findIndex(element => element[0] === id);

          orderChangesData.range = `pedido!E${orderIndex + 1}`;
          orderChangesData.values = [['entregado']];
          console.log(orderChangesData);

          const updatedOrderStatus = await sheetsApi.spreadsheets.values.update({
            spreadsheetId: spreadsheetId,
            range: orderChangesData.range,
            valueInputOption: 'RAW',
            requestBody: {
              values: orderChangesData.values,
            },
          });

          if (updatedOrderStatus.statusText === "OK") {
            const orderUpdated = JSON.parse(updatedOrderStatus.config.body).values[0];
            return {
              success: true,
              message: 'Datos actualizados correctamente.',
              status: orderUpdated[0],
              idOrder: id
            }
          }
        }
      }

    } catch (error) {

    }
  }
}

module.exports = OrdersService;
