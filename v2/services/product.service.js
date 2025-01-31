const { getGoogleSheetsClient } = require('../../utils/getGoogleSheetsClient');

class ProductService {
  constructor () {
    this.products = [];
  }

  async create (newProductData) {
    try {
      const sheetsApi = await getGoogleSheetsClient();
      const spreadsheetId = '1VBk8B9E2uA98Zs3yEqrTl1uFqsRWNVG06LAlqIFazrs';
      const ranges = ["product", "categorias"];

      const response = await sheetsApi.spreadsheets.values.batchGet({
        spreadsheetId: spreadsheetId,
        ranges: ranges,
      });
      let productSheetRows = response.data.valueRanges[0].values;
      let categorySheetRows = response.data.valueRanges[1].values;
      let categoryName;

      // obtiene el nombre de la categoría del producto
      if (newProductData.idCategory) {
        categorySheetRows.forEach(element => {
          if (parseInt(element[0]) === parseInt(newProductData.idCategory)) {
            categoryName = element[1];
          }
        })
      }

      let productNextId = productSheetRows.length === 1 ? 1 : (productSheetRows.length - 1) + 1;

      const productSheetValuesToAppend = {
        range: ranges[0],
        values: [[productNextId, newProductData.name, newProductData.description || "", newProductData.measurementUnit, parseInt(newProductData.price), parseInt(newProductData.idCategory), newProductData.idSuppliers, newProductData.quantities || ""]],
      };

      const productSavedData = await sheetsApi.spreadsheets.values.append({
        spreadsheetId: spreadsheetId,
        range: productSheetValuesToAppend.range,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: productSheetValuesToAppend.values,
        },
      });

      if (productSavedData.statusText === "OK") {

        const productSheetResponse = JSON.parse(productSavedData.config.body).values[0];

        return {
          success: true,
          message: 'Datos guardados correctamente',
          savedData: {
            id: productSheetResponse[0],
            name: productSheetResponse[1],
            description: productSheetResponse[2],
            measurementUnit: productSheetResponse[3],
            price: productSheetResponse[4],
            category: categoryName,
          },
        }
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
      const productsList = [];
      const sheetsApi = await getGoogleSheetsClient();
      const spreadsheetId = '1VBk8B9E2uA98Zs3yEqrTl1uFqsRWNVG06LAlqIFazrs';
      const ranges = ["product", "categorias", "inventory"];

      const response = await sheetsApi.spreadsheets.values.batchGet({
        spreadsheetId: spreadsheetId,
        ranges: ranges,
      });

      const productSheetRows = response.data.valueRanges[0].values;
      const categorySheetRows = response.data.valueRanges[1].values;
      const inventorySheetRows = response.data.valueRanges[2].values;

      productSheetRows.shift();
      productSheetRows.forEach(product => {
        const productData = {};

        productData.idProduct = parseInt(product[0]);
        productData.name = product[1];
        productData.description = product[2];
        productData.measurementUnit = product[3];
        productData.price = parseInt(product[4]);
        productData.idSupplier = parseInt(product[6]) || null;

        const SeVendePorCantidadesDe = product[7].split(",").map(number => Number(number.trim()));

        productData.quantities = SeVendePorCantidadesDe;
        productData.stock = parseInt(product[8]) || 0;
        productData.total = parseInt(product[9]) || 0;

        categorySheetRows.forEach(category => {
          if (category[0] === product[5]) {
            productData.category = {
              idCategory: parseInt(category[0]),
              name: category[1]
            };
          }
        });

        productData.inventoryRegistrations = [];

        inventorySheetRows.forEach(registration => {
          if (registration[1] === product[0]) {
            productData.inventoryRegistrations.push({
              idInvetory: parseInt(registration[0]),
             idProduct: parseInt(registration[1]),
             quantity: parseInt(registration[2]),
             transaction: registration[3],
             date: registration[4],
             idOrder: registration[5] || null,
             notes: registration[6] || '',
             idSupplier: registration[7]
            });
          }
        });

        productsList.push(productData);
      });

      this.products = productsList;
      return this.products;
       // Formato de output:
      // {
      //   idProducto: 1,
      //   name: "ATÚN",
      //   description: "marca chunk tuna en aceite",
      //   measurementUnit: "lata",
      //   price: 5500,
      //   category: "Pescados y Mariscos",
      //   stock: 21,
      //   "basePrice": 302500,
      //  "finalPrice": 347875,
      //   quantities: [
      //     [1, 2, 3, 4, 5, 6]
      //   inventoryRegistrations: [
      //     {
      //        idInvetory: 1,
      //        idProduct: 1,
      //        quantity: 21,
      //        transaction: ingreso,
      //        date: 2024-01-05,
      //        idOrder: 1,
      //        notes: "primer ingreso de productos"
      //      }
      //   ]
      // }

    } catch (error) {
      console.log(error);
    }


  }
}

module.exports = ProductService;
