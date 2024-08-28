class OrderService {
  constructor () {
    this.orders = [];
    this.orderOptions = [];
  }

  async find() {
    const sheetsApi = await this.getGoogleSheetsClient();
    const spreadsheetId = '1VBk8B9E2uA98Zs3yEqrTl1uFqsRWNVG06LAlqIFazrs';
    const range = "PRUEBA BD VERCEL";

    try {
      const response = await sheetsApi.spreadsheets.values.get({
        spreadsheetId,
        range,
      });
      const data = response.data.values;
      data.shift();
      const options = await this.getOrderOptions();

      data.forEach((sheetOrder) => {
        let keyValue = {};
        options[0].forEach((key, index) => {

          if (sheetOrder[index] !== '') {
            keyValue[key] = sheetOrder[index];
          }
        });

        this.orders.push(keyValue);
      });

      return this.orders;

    } catch (error) {
      console.error('Error al obtener los pedidos:', error);
    }
  }

  async getOrderOptions() {
    const sheetsApi = await this.getGoogleSheetsClient();
    const spreadsheetId = '1VBk8B9E2uA98Zs3yEqrTl1uFqsRWNVG06LAlqIFazrs';
    const range = "PRUEBA BD VERCEL!A1:AP1";

    try {
      const response = await sheetsApi.spreadsheets.values.get({
        spreadsheetId,
        range,
      });
      const values = response.data.values;

      return values;
    } catch (error) {
      console.error('Error al obtener los pedidos:', error);
    }
  }

  async appendOrder(orderData) {
    const sheetsApi = await this.getGoogleSheetsClient();

    const spreadsheetId = '1VBk8B9E2uA98Zs3yEqrTl1uFqsRWNVG06LAlqIFazrs';
    const range = 'PRUEBA BD VERCEL';
    const valueInputOption = 'USER_ENTERED';

    const formData = Object.entries(orderData);
    const data = await this.getData();

    const order = [];
    const options = data.data.values[0];

    options.forEach(option => {
      const contain = formData.find(element => element.includes(option));
      if (contain === undefined) {
        order.push('');
      } else if (contain[0] === option) {
        order.push(contain[1]);
      }
    });

    console.log('order', order)

    const resource = {
      values: [
        order,
      ]
    };

    try {
      const response = await sheetsApi.spreadsheets.values.append({
        spreadsheetId,
        range,
        valueInputOption,
        resource,
      });
      console.log(`${response.data.updates.updatedCells} celdas actualizadas.`);
    } catch (error) {
      console.error('Error al escribir en Google Sheets:', error);
    }
  }

  async getData() {
    const sheetsApi = await this.getGoogleSheetsClient();
    const spreadsheetId = '1VBk8B9E2uA98Zs3yEqrTl1uFqsRWNVG06LAlqIFazrs';
    const range = "PRUEBA BD VERCEL!A:AP";

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

module.exports = OrderService
