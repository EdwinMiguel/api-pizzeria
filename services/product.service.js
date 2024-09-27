const { google } = require('googleapis');
const { getGoogleSheetsClient } = require('../utils/getGoogleSheetsClient');

class ProductsService {
  constructor () {
    this.products = [];
  }

  async find () {
    const spreadsheetId = '1VBk8B9E2uA98Zs3yEqrTl1uFqsRWNVG06LAlqIFazrs';
    const range = "LISTA PRECIOS";

    try {
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

      const response = await sheetsApi.spreadsheets.values.get({
        spreadsheetId,
        range,
      });
      const data = response.data.values;
      data.shift();
      const productsList = [];
      const products = data;
      products.forEach(item => {
        const product = {
          id: item[0],
          name: item[1],
          price: item[2]
        }
        productsList.push(product);
      })
      this.products = productsList;

      return this.products;
    } catch (error) {
      console.error(error);
    }

  }

  async save (formData) {
    try {
      const sheetsApi = await getGoogleSheetsClient();
      const spreadsheetId = '1VBk8B9E2uA98Zs3yEqrTl1uFqsRWNVG06LAlqIFazrs';
      const sheetName = "STOCK";
      const sheetData = await sheetsApi.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: sheetName,
      });

      const productsData = sheetData.data.values;
      const headers = productsData[0].map(header => header.trim());

      const row = headers.map(() => '');

      headers.forEach((header, headerIndex) => {
        if (header === 'PRODUCTO') {
          row[headerIndex] = formData['product-name'];
        } else if (header === 'FECHA INGRESO') {
          row[headerIndex] = formData['arrival-date'];
        } else if (header === 'TIPO MEDIDA') {
          row[headerIndex] = formData.unit;
        } else if (header === 'CANTIDAD INGRESO') {
          const quantityToNumber = Number(formData.quantity);
          row[headerIndex] = quantityToNumber;
        }
      });

      const values = {
        values: [row]
      }

        const response = await sheetsApi.spreadsheets.values.append({
          spreadsheetId: spreadsheetId,
          range: sheetName,
          valueInputOption: 'USER_ENTERED',  // 'RAW' para valores sin formato, 'USER_ENTERED' para valores como si los escribiera un usuario
          resource: values
        });
        return response;
    } catch (error) {
      console.log(error);
    }
  }

  async update (id, changes) {
    const index = this.products.findIndex(item => item.id === Number(id));

    if (index === -1) {
      throw new Error('Product not found');
    };

    const product = this.products[index];
    this.products[index] = {
      ...product,
      ...changes
    };

    return this.products[index];
  }

  async delete(id) {
    const index = this.products.findIndex(item => item.id === id);

    if (index === -1) {
      console.log('product not found')
    }

    this.products.splice(index, 1);

    return { id };
  }

  async createId() {
    const id = this.products.length + 1;
    return id;
  }

}

module.exports = ProductsService;
