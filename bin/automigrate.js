const path = require('path');

const app = require(path.resolve(__dirname, '../server/server'));
const ds = app.datasources.stat;

ds.automigrate('Stat', function (err) {
  if (err) throw err;

  app.models.Stat.uploadData(__dirname + '/../files/initial.xlsx')
    .then(() => ds.disconnect());
});





