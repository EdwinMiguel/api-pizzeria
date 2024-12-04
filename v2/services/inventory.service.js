const { getGoogleSheetsClient } = require('../../utils/getGoogleSheetsClient');

class InventoryService {
  constructor() {

  }
  // idInventory	idProduct	quantity	transaction	date	idOrder	notes
  async create (data) {
    console.log(data);
    try {
      const sheetsApi = await getGoogleSheetsClient();
      const spreadsheetId = '1VBk8B9E2uA98Zs3yEqrTl1uFqsRWNVG06LAlqIFazrs';
      const ranges = ["inventory","product"];

      const getSheets = await sheetsApi.spreadsheets.values.batchGet({
        spreadsheetId: spreadsheetId,
        ranges: ranges,
      });

      const inventorySheetRows = getSheets.data.valueRanges[0].values;
      const productsSheetRows = getSheets.data.valueRanges[1].values;

      productsSheetRows.shift();
      const product = productsSheetRows.find(row => row[0] === data.idProduct);

      let nextInventoryId = inventorySheetRows.length === 1 ? 1 : (inventorySheetRows.length - 1) + 1;

      const date = () => {
        const now = new Date();
        // Convertir a hora de Colombia (UTC-5)
        const colombiaTime = new Date(now.getTime() - (5 * 60 * 60 * 1000));

        // Formatear la fecha y hora
        const year = colombiaTime.getUTCFullYear();
        const month = String(colombiaTime.getUTCMonth() + 1).padStart(2, '0');
        const day = String(colombiaTime.getUTCDate()).padStart(2, '0');
        const hours = String(colombiaTime.getUTCHours()).padStart(2, '0');
        const minutes = String(colombiaTime.getUTCMinutes()).padStart(2, '0');

        // Crear string formateado
        const timestamp = `${year}-${month}-${day} ${hours}:${minutes}`;

        return timestamp;
      }

      const registration = {
        values: [
          [nextInventoryId, product[0], data.quantity,"ingreso", date(), null, data.notes || null, data.totalCost, data.unitPrice, data.idSupplier]
        ]
      }

    const response = await sheetsApi.spreadsheets.values.append({
      spreadsheetId: spreadsheetId,
      range: ranges[0],
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      resource: registration
    });

    if (response.statusText === "OK") {
      const inventorySheetResponse = JSON.parse(response.config.body).values[0];
      return {
        success: true,
        message: 'Stock registrado exitosamente.',
        savedData: {
          idInventory: inventorySheetResponse[0],
          idProduct: inventorySheetResponse[1],
          quantity: inventorySheetResponse[2],
          transaction: inventorySheetResponse[3],
          date: inventorySheetResponse[4],
          idOrder: inventorySheetResponse[5],
          notes: inventorySheetResponse[6],
          name: product[1],
          measurementUnit: product[3],
        },
      }

    }

    } catch (error) {
      console.log(error);
    }
  }
}

module.exports =  InventoryService;
