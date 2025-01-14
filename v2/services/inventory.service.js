const { getGoogleSheetsClient } = require('../../utils/getGoogleSheetsClient');

class InventoryService {
  constructor() {
    this.registrations = [];
  }
  // idInventory	idProduct	quantity	transaction	date	idOrder	notes
  async create (data) {
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
          [nextInventoryId, product[0], data.quantity,"ingreso", date(), null, data.notes || null, data.idSupplier]
        ]
      }

    const inventoryResponse = await sheetsApi.spreadsheets.values.append({
      spreadsheetId: spreadsheetId,
      range: ranges[0],
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      resource: registration
    });

    if (inventoryResponse.statusText === "OK") {
      const newStock = {};
      const orderIndex = productsSheetRows.findIndex(row => row[0] === data.idProduct);

      const rowsToUpdate = [];

      if (product[8] === undefined) {
        newStock.value = 0 + parseInt(data.quantity);
        newStock.newTotal = parseInt(product[4]) * 0;
      } else {
        newStock.value = parseInt(product[8]) + parseInt(data.quantity);
        newStock.newTotal = parseInt(product[4]) * newStock.value;
      }

      const startRowIndex = orderIndex + 1;
      const endRowIndex = orderIndex + 2;

      const request = { // este objeto contiene los datos necesarios para actualizar celdas con batchUpdate
        updateCells: {
          range: {
            sheetId: 23587344, // Cambia este valor al ID de tu hoja (puedes obtenerlo con `spreadsheets.get`)
            startRowIndex: startRowIndex,
            endRowIndex: endRowIndex,
            startColumnIndex: 8, // Primera columna
            endColumnIndex: 10, // Última columna (exclusiva)
          },
          rows: [
            {
              values: [
                  { userEnteredValue: { numberValue: newStock.value } },
                  { userEnteredValue: { numberValue:  newStock.newTotal } },
              ],
            },
          ],
          fields: "*",
        },
      }

      rowsToUpdate.push(request);

      let response = await sheetsApi.spreadsheets.batchUpdate({
        spreadsheetId,
        resource: { requests: rowsToUpdate },
      });

      const productResponse = JSON.parse(response.config.body).requests[0].updateCells.rows[0].values;

      return {
        success: true,
        message: 'Stock registrado exitosamente.',
        savedData: {
          idInventory: registration.values[0][0],
          idProduct: registration.values[0][1],
          quantity: registration.values[0][2],
          transaction: registration.values[0][3],
          date: registration.values[0][4],
          idOrder: registration.values[0][5],
          notes: registration.values[0][6],
          name: product[1],
          measurementUnit: product[3],
        },
      }
    }

    } catch (error) {
      console.log(error);
    }
  }

  async find () {
    // Objeto de las transacciones que son de ingreso:
      // {
      //   id: 1,
      //   transaction: "ingreso",
      //   date: "2024-11-17 15:54",
      //   notes: "Actualización 17 noviembre",
      //   product: {
      //     id: 1,
      //     name: "ATÚN",
      //     quantity: 19,
      //   },
      //   supplier: {
      //     id: 3,
      //     name: "Praismar",
      //   }
      // }

      // Objeto de las transacciones que son de salida:
      // {
      //   id: 1,
      //   transaction: "salida",
      //   date: "2024-11-17 15:54",
      //   notes: "",
      //   product: {
      //     id: 1,
      //     name: "ATÚN",
      //     quantity: 19,
      //   },
      //   supplier: {
      //     id: null,
      //     name: null,
      //   }
      // }
    try {
      const sheetsApi = await getGoogleSheetsClient();
      const spreadsheetId = '1VBk8B9E2uA98Zs3yEqrTl1uFqsRWNVG06LAlqIFazrs';
      const ranges = ["inventory","product", "proveedores"];

      const getSheets = await sheetsApi.spreadsheets.values.batchGet({
        spreadsheetId: spreadsheetId,
        ranges: ranges,
      });

      const inventorySheetData = getSheets.data.valueRanges[0].values;
      const productSheetData = getSheets.data.valueRanges[1].values;
      const proveedorSheetData = getSheets.data.valueRanges[2].values;
      const registrationsList = [];

      inventorySheetData.shift()
      inventorySheetData.forEach(row => {

        let registration;

        const productData = productSheetData.find(productRow => productRow[0].toLowerCase().trim() === row[1].toLowerCase().trim());

        const supplierData = proveedorSheetData.find(supplierRow => supplierRow[0] === row[7]);

        if (row[3].toLowerCase().trim() === "salida") {
          registration = {
            id: parseInt(row[0]),
            transaction: row[3],
            date: row[4],
            notes: row[6] || null,
            product: {
              id: parseInt(row[1]),
              name: productData[1],
              quantity: parseInt(row[2]),
            },
            supplier: {
              id: null,
              name: null
            }
          }

        } else if (row[3].toLowerCase().trim() === "ingreso") {
          registration = {
            id: parseInt(row[0]),
            transaction: row[3],
            date: row[4],
            notes: row[6] || null,
            product: {
              id: parseInt(row[1]),
              name: productData[1],
              quantity: parseInt(row[2]),
            },
            supplier: {
              id: parseInt(row[7]),
              name: supplierData[1]
            }
          }
        }

        registrationsList.push(registration);
      });

      this.registrations = registrationsList;
      return this.registrations;

    } catch (error) {
      console.log(error);
    }
  }
}

module.exports =  InventoryService;
