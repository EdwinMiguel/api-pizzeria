const { getGoogleSheetsClient } = require('./getGoogleSheetsClient');

exports.generateUniqueId = async () => {
  const sheetsApi = await getGoogleSheetsClient();
  const spreadsheetId = '1VBk8B9E2uA98Zs3yEqrTl1uFqsRWNVG06LAlqIFazrs';
  const range = 'CANTIDAD PEDIDOS';

  const response = await sheetsApi.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  const newOrderId = response.data.values.length;
  return newOrderId;
};
