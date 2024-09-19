const { google } = require('googleapis');
const { generateUniqueId } = require('../utils/generateUniqueId')

class OrderService {
  constructor () {
    this.orders = [];
    this.orderOptions = [];
  }

  async find() {
    const sheetsApi = await this.getGoogleSheetsClient();
    const spreadsheetId = '1VBk8B9E2uA98Zs3yEqrTl1uFqsRWNVG06LAlqIFazrs';
    const range = "CANTIDAD PEDIDOS";
    const orderPricesRange = 'PRECIO PRODUCTOS';

    try {
      const ordersSheet = await sheetsApi.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: range,
      });
      const ordersSheetData = ordersSheet.data.values;
      const ordersSheetHeaders = ordersSheetData[0].map(header => header.trim());
      ordersSheetData.shift();

      const ordersPricesSheet = await sheetsApi.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: orderPricesRange,
      });
      const ordersPricesData = ordersPricesSheet.data.values;
      const ordersPricesHeaders = ordersPricesData[0].map(header => header.trim());
      ordersPricesData.shift();

      const ordersWithOutPrices = ordersSheetData.map(row => {
        let order = {
          products: [],
        }

        ordersSheetHeaders.forEach((header , headerIndex) => {
          if (header === 'Marca temporal') {
            order[header] = row[headerIndex];
          } else if (header === 'ID PEDIDO') {
            order[header] = row[headerIndex];
          } else if (header === 'SEDE') {
            order[header] = row[headerIndex];
          } else if (header === 'FECHA ENTREGA') {
            order[header] = row[headerIndex];
          } else if (header === 'ESTADO') {
            order[header] = row[headerIndex];
          } else if (header === 'OBSERVACIONES') {
            order[header] = row[headerIndex];
          } else {
            if (row[headerIndex] !== '' && row[headerIndex] !== undefined) {
            order.products.push({
              name: header,
              quantity: row[headerIndex],
            });
            }
          }
        });

        return order;

      });

        const orderPricesHeadersIndex = (index) => {
          return ordersPricesHeaders.findIndex(header => header === index);
        }

        ordersWithOutPrices.forEach(order => {
          const headerIndex = orderPricesHeadersIndex('ID PEDIDO');
          const currentPrices = ordersPricesData.find(row => row[headerIndex] === order['ID PEDIDO']);

          if (currentPrices !== undefined) {
            const newProducts = order.products.map(product => {
              const headerIndex = orderPricesHeadersIndex(product.name);
              return {
                ...product,
                totalPrice: currentPrices[headerIndex]
              }
            });

            const netCostIndex = orderPricesHeadersIndex('VALOR NETO');
            order.netCost = currentPrices[netCostIndex];
            const costWithServiceIndex = orderPricesHeadersIndex('VALOR CON SERVICIO');
            order.costWithService = currentPrices[costWithServiceIndex];

            order.products = newProducts;
          }
        });

        this.orders = ordersWithOutPrices;
        return this.orders;
    } catch (error) {
      console.error('Error al obtener los pedidos:', error);
    }
  }

  async getOrderOptions() {
    const sheetsApi = await this.getGoogleSheetsClient();
    const spreadsheetId = '1VBk8B9E2uA98Zs3yEqrTl1uFqsRWNVG06LAlqIFazrs';
    const range = "CANTIDAD PEDIDOS";

    try {
      const response = await sheetsApi.spreadsheets.values.get({
        spreadsheetId,
        range,
      });
      const values = response.data.values[0];
      this.orderOptions = values;
      return values;
    } catch (error) {
      console.error('Error al obtener los pedidos:', error);
    }
  }

  async appendOrder(orderData) {
    const sheetsApi = await this.getGoogleSheetsClient();

    const spreadsheetId = '1VBk8B9E2uA98Zs3yEqrTl1uFqsRWNVG06LAlqIFazrs';
    const range = 'CANTIDAD PEDIDOS';
    const valueInputOption = 'USER_ENTERED';

    const data = await this.getData(range);

    const orderId = await generateUniqueId();


    const order = [];
    const options = data.data.values[0].map(header => header.trim());
    console.log(options);

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

    options.forEach(option => order.push(''));

    options.forEach((header, headerIndex) => {
      if (header === "Marca temporal") {
        order[headerIndex] = date();
      } else if (header === "ID PEDIDO") {
        order[headerIndex] = orderId;
      } else if (header === "SEDE") {
        order[headerIndex] = orderData.SEDE;
      } else if (header === "FECHA ENTREGA") {
        order[headerIndex] = orderData['FECHA ENTREGA'];
      } else if (header === "ESTADO") {
        order[headerIndex] = 'pendiente';
      } else if (header === "OBSERVACIONES") {
        order[headerIndex] = orderData.OBSERVACIONES;
      }

      orderData.products.forEach(product => {
        if (product.name === header) {
          order[headerIndex] = product.quantity;
        }
      });
    });

    const resource = {
      values: [
        order,
      ]
    };

    const orderPricesSheetName = 'PRECIO PRODUCTOS';
    const orderPricesSheetData = await this.getData(orderPricesSheetName);
    const orderPricesHeaders = orderPricesSheetData.data.values[0].map(header => header.trim());
    const orderPrices = [];

    orderPricesHeaders.forEach(() => orderPrices.push(''));

    orderPricesHeaders.forEach((header, headerIndex) => {
      if (header === "ID PEDIDO") {
        orderPrices[headerIndex] = orderId;
      } else if (header === 'VALOR NETO') {
        orderPrices[headerIndex] = orderData.orderPrice;
      } else if (header === 'VALOR CON SERVICIO') {
        orderPrices[headerIndex] = orderData.finalPrice;
      }

      orderData.products.forEach(product => {
        if (product.name === header) {
          orderPrices[headerIndex] = product.totalPrice;
        }
      });
    })
    console.log(orderPrices);

    const orderPricesResource = {
      values: [
        orderPrices,
      ]
    };

    try {
      const response = await sheetsApi.spreadsheets.values.append({
        spreadsheetId: spreadsheetId,
        range: range,
        valueInputOption: valueInputOption,
        resource: resource,
      });

      const responseOrderPrices = await sheetsApi.spreadsheets.values.append({
        spreadsheetId: spreadsheetId,
        range: orderPricesSheetName,
        valueInputOption: valueInputOption,
        resource: orderPricesResource,
      });

      console.log(`${response.data.updates.updatedCells} celdas actualizadas.`);
      console.log(`${responseOrderPrices.data.updates.updatedCells} celdas actualizadas.`);
    } catch (error) {
      console.error('Error al escribir en Google Sheets:', error);
    }
  }

  async getData(sheetName) {
    const sheetsApi = await this.getGoogleSheetsClient();
    const spreadsheetId = '1VBk8B9E2uA98Zs3yEqrTl1uFqsRWNVG06LAlqIFazrs';
    const range = sheetName;

    try {
      const response = await sheetsApi.spreadsheets.values.get({
        spreadsheetId,
        range,
      });
      return response;
    } catch (error) {
      console.error('Error al obtener los pedidos:', error);
    }
  }

  async getGoogleSheetsClient() {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
      },
      project_id: process.env.GOOGLE_PROJECT_ID,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const client = await auth.getClient();
    const sheetsApi = google.sheets({
      version: 'v4',
      auth: client
    });

    return sheetsApi;
  }

}

module.exports = OrderService;
