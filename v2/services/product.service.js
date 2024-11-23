const { getGoogleSheetsClient } = require('../../utils/getGoogleSheetsClient');

class ProductService {
  constructor () {
    this.products = [];
  }

  async create (newProductData) {
    try {
      const sheetsApi = await getGoogleSheetsClient();
      const spreadsheetId = '1VBk8B9E2uA98Zs3yEqrTl1uFqsRWNVG06LAlqIFazrs';
      const ranges = ["product", "productoCantidades", "categoria"];

      const response = await sheetsApi.spreadsheets.values.batchGet({
        spreadsheetId: spreadsheetId,
        ranges: ranges,
      });

      let productSheetRows = response.data.valueRanges[0].values;
      let categorySheetRows = response.data.valueRanges[2].values;
      let categoryName;

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
        values: [[productNextId, newProductData.name, newProductData.description, newProductData.measurementUnit, parseInt(newProductData.price), parseInt(newProductData.idCategory)]],
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
        let quantitiesSheetResponse;
        if (newProductData.quantities) {
          let rowsValues = [];
          newProductData.quantities.forEach(element => {
            const quantityToNumber = parseInt(element);

            rowsValues.push([productNextId, quantityToNumber,newProductData.measurementUnit]);
          });

          const productQuantitiesData = {
            range: ranges[1],
            values: rowsValues,
          };

          const quantitiesSaved = await sheetsApi.spreadsheets.values.append({
            spreadsheetId: spreadsheetId,
            range: productQuantitiesData.range,
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            requestBody: {
              values: productQuantitiesData.values,
            },
          });

          if (quantitiesSaved.statusText === "OK") {
            quantitiesSheetResponse = JSON.parse(quantitiesSaved.config.body).values.map((item) => item.slice(1));
          }
        }

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
            quantities:quantitiesSheetResponse
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
      const ranges = ["product", "productoCantidades", "categoria", "inventory"];

      const response = await sheetsApi.spreadsheets.values.batchGet({
        spreadsheetId: spreadsheetId,
        ranges: ranges,
      });

      const productSheetRows = response.data.valueRanges[0].values;
      const productQuantitiesSheetRows = response.data.valueRanges[1].values;
      const categorySheetRows = response.data.valueRanges[2].values;
      const inventorySheetRows = response.data.valueRanges[3].values;

      productSheetRows.shift()
      productQuantitiesSheetRows.shift()
      inventorySheetRows.shift()

      productSheetRows.forEach(product => {
        const productData = {};
        productData.idProduct = product[0];
        productData.name = product[1];
        productData.description = product[2];
        productData.measurementUnit = product[3];
        productData.price = parseInt(product[4]);

        categorySheetRows.forEach(category => {
          if (category[0] === product[5]) {
            productData.category = {
              idCategory: category[0],
              name: category[1]
            };
          }
        });


        productData.quantities = [];
        productQuantitiesSheetRows.forEach(quantity => {
          if (quantity[0] === product[0]) {
            productData.quantities.push(quantity[1]);
          }
        });

        productData.inventoryRegistrations = [];

        productData.stock = 0;
        let stock = 0;
        inventorySheetRows.forEach(registration => {
          if (registration[1] === product[0]) {
            console.log("registration", registration[1], product[0]);
            productData.inventoryRegistrations.push({
              idInvetory: registration[0],
             idProduct: registration[1],
             quantity: parseInt(registration[2]),
             transaction: registration[3],
             date: registration[4],
             idOrder: registration[5] || null,
             notes: registration[6] || ''
            });

            if (registration[3] === "ingreso") {
              stock += parseInt(registration[2]);
            } else if (registration[3] === "salida") {
              stock -= parseInt(registration[2]);
            }
            productData.stock = stock;
            productData.basePrice = parseInt(productData.stock) * product[4];
            productData.finalPrice = ((15 * parseInt(productData.basePrice)) / 100) + productData.basePrice;
          }
        });

        productsList.push(productData);
      });

      this.products = productsList;
      return this.products;
       // Formato de objeto
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
