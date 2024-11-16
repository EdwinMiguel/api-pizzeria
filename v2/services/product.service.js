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
}

module.exports = ProductService;
