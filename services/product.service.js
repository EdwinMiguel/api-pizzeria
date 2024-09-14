const { google } = require('googleapis');

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

  async save (product) {
    const newProduct = {
      id: await this.createId(),
      name: product.name,
      price: product.price,
      stock: product.stock
    };

    this.products.push(newProduct);
    return this.products;
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
