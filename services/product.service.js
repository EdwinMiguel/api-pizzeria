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

      let range;
      let values;
      // {
      //   'product-name': 'ATÚN',
      //   quantity: '5',
      //   unit: 'libras',
      //   'arrival-date': '2024-09-27'
      // }

      productsData.forEach((row, index) => {
        if (row.includes(formData['product-name'])) {
          formData.unit.toLowerCase();
          if (formData.unit === 'libras') {
            const rowIndex = createNewValues('LIBRAS STOCK', row, index);
            range = getCell('LIBRAS STOCK', rowIndex);
          } else if (formData.unit === 'unidades') {
            const rowIndex = createNewValues('UNIDADES STOCK', row, index);
            range = getCell('UNIDADES STOCK', rowIndex);
          } else if (formData.unit === 'frascos') {
            const rowIndex = createNewValues('FRASCOS STOCK', row, index);
            range = getCell('FRASCOS STOCK', rowIndex);
          } else if (formData.unit === 'bloques') {
            const rowIndex = createNewValues('BLOQUES STOCK', row, index);
            range = getCell('BLOQUES STOCK', rowIndex);
          } else if (formData.unit === 'bandejas') {
            const rowIndex = createNewValues('BANDEJAS STOCK', row, index);
            range = getCell('BANDEJAS STOCK', rowIndex);
          }
        }
      });

      function createNewValues(headerName, row, currentIndex) {
        const headerIndex = headers.indexOf(headerName);
            console.log(headerIndex);
            const newQuantity = Number(formData.quantity) + Number(row[headerIndex]);
            values = {
              values: [[newQuantity]]
            }
            const rowIndex = currentIndex + 1;
            return rowIndex;
      }

      function getCell(headerName, rowIndex) {
        const columnIndex = headers.indexOf(headerName);
        const columnLetter = String.fromCharCode(65 + columnIndex);
        const range = `${sheetName}!${columnLetter}${rowIndex}`;
        return range;
      }

      async function updateCell(cellRange, value) {
        const response = await sheetsApi.spreadsheets.values.update({
          spreadsheetId: spreadsheetId,
          range: cellRange,
          valueInputOption: 'USER_ENTERED',  // 'RAW' para valores sin formato, 'USER_ENTERED' para valores como si los escribiera un usuario
          resource: value
        });
        return response;
      }
      const response = await updateCell(range, values);
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
