const { getGoogleSheetsClient } = require('../../utils/getGoogleSheetsClient');

class CategoriesService {
  constructor() {
    this.categories = [];
  }

  async find () {
    try {
      const sheetsApi = await getGoogleSheetsClient();
      const spreadsheetId = '1VBk8B9E2uA98Zs3yEqrTl1uFqsRWNVG06LAlqIFazrs';

      const response = await sheetsApi.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: "categorias",
      });
      const categoriesSheetRows = response.data.values;

      let categoriesList = [];

      categoriesSheetRows.shift();
      categoriesSheetRows.forEach(row => {
        categoriesList.push({
          idCategories: row[0],
          name: row[1]
        });
      });

      this.categories = categoriesList;

      return this.categories;
      // Output:
      // {
      //   idCategories: 1,
      //   name: "Especias y Condimentos",
      // }
    } catch (error) {

    }
  }
}

module.exports = CategoriesService;
