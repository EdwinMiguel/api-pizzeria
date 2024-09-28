const { google } = require('googleapis');
const { getGoogleSheetsClient } = require('../utils/getGoogleSheetsClient');

class ProductsService {
  constructor () {
    this.products = [];
  }

  async find () {

    try {
      const sheetsApi = await getGoogleSheetsClient();
      const spreadsheetId = '1VBk8B9E2uA98Zs3yEqrTl1uFqsRWNVG06LAlqIFazrs';
      const range = "STOCK";
      const productsSheet = await sheetsApi.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: range,
      });
      const productsSheetData = productsSheet.data.values;
      productsSheetData.shift();

      /*
      {
        product-name: ,
        stock: ,
        valor-total: ,
      }
      */


      // const auth = new google.auth.GoogleAuth({
      //   credentials: {
      //     private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      //     client_email: process.env.GOOGLE_CLIENT_EMAIL,
      //   },
      //   project_id: process.env.GOOGLE_PROJECT_ID,
      //   scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      // });

      // const client = await auth.getClient();
      // const sheetsApi = google.sheets({
      //   version: 'v4',
      //   auth: client
      // });

      // const response = await sheetsApi.spreadsheets.values.get({
      //   spreadsheetId,
      //   range,
      // });
      // const data = response.data.values;
      // data.shift();
      // const productsList = [];
      // const products = data;
      // products.forEach(item => {
      //   const product = {
      //     id: item[0],
      //     name: item[1],
      //     price: item[2]
      //   }
      //   productsList.push(product);
      // })
      // this.products = productsList;

      // return this.products;
    } catch (error) {
      console.error(error);
    }

  }

  async save (formData) {
    try {
      const sheetsApi = await getGoogleSheetsClient();
      const spreadsheetId = '1VBk8B9E2uA98Zs3yEqrTl1uFqsRWNVG06LAlqIFazrs';
      const sheetName = "PRODUCTO";
      const sheetData = await sheetsApi.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: sheetName,
      });

      const productsData = sheetData.data.values.map(row => {
          return row.map(value => value.trim());
      });
      const headers = productsData[0];

      function getCell(headerName, rowIndex) {
        const columnIndex = headers.indexOf(headerName);
        const columnLetter = String.fromCharCode(65 + columnIndex);
        const range = `${sheetName}!${columnLetter}${rowIndex}`;
        return range;
      }

      async function postValue(cellRange, resource) {
        const response = await sheetsApi.spreadsheets.values.update({
          spreadsheetId: spreadsheetId,
          range: cellRange,
          valueInputOption: 'USER_ENTERED',  // 'RAW' para valores sin formato, 'USER_ENTERED' para valores como si los escribiera un usuario
          resource: resource
        });
        return response;
      }

      let range;
      const stockValue = {
        values: []
      }

      productsData.forEach((row, rowIndex)=> {
        if (row.includes(formData['product-name'])) {
          if (row.length < headers.length) {
            for (let index = row.length; index < headers.length; index++) {
              row.push('');
            }
          }
          range = getCell('stock', rowIndex + 1);
          const headerIndex = headers.indexOf('stock');
          const quantity = Number(formData.quantity) + Number(row[headerIndex]);
          stockValue.values.push([quantity]);
        }
      });
      const response = await postValue(range, stockValue);
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
