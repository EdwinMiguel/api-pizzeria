const { getGoogleSheetsClient } = require('../../utils/getGoogleSheetsClient');

class SuppliersService {
  constructor() {
    this.suppliers = [];
  }

  async find () {
    try {
      const sheetsApi = await getGoogleSheetsClient();
      const spreadsheetId = '1VBk8B9E2uA98Zs3yEqrTl1uFqsRWNVG06LAlqIFazrs';

      const response = await sheetsApi.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: "proveedores",
      });
      const SuppliersSheetRows = response.data.values;

      let suppliersList = [];

      SuppliersSheetRows.shift();
      SuppliersSheetRows.forEach(row => {
        suppliersList.push({
          idSupplier: row[0],
          name: row[1]
        });
      });

      this.suppliers = suppliersList;

      return this.suppliers;
      // Output:
      // {
      //   idSupplier: 1,
      //   name: "La Receta",
      // }
    } catch (error) {

    }
  }
}

module.exports = SuppliersService;
