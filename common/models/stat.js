const fs = require('fs');
const Excel = require('exceljs');
const formidable = require('formidable');
const stream = require('stream');

module.exports = function (Stat) {
  Stat.getAttributes = function (id, cb) {
    Stat.find(
      {
        fields: ["attribute", "reading"],
        where: {machine: id}
      },
      (err, models) => {
        const response = {
          machine: id,
          data: models
        };

        cb(null, response);
      }
    );
  };

  Stat.remoteMethod('getAttributes', {
    http: {path: '/getAttributesByMachine/:id', verb: 'get'},
    accepts: {arg: 'id', type: 'string'},
    returns: {arg: 'attributes', type: 'array'}
  });

  Stat.upload = function (req, res) {
    const form = new formidable.IncomingForm();

    form.parse(req, async function (err, fields, files) {
      await Stat.uploadData(files.file.path)
      res.end(JSON.stringify({data:"Data has been uploaded"}));
    });
  };

  Stat.remoteMethod('upload', {
    description: 'Uploads a file',
    accepts: [
      {arg: 'req', type: 'object', http: {source: 'req'}},
      {arg: 'res', type: 'object', http: {source: 'res'}},
      {arg: 'body', type: 'object', http: {source: 'body'}}
    ],
    returns: {
      arg: 'data',
      type: 'Object',
      root: true
    },
    http: {verb: 'post', path: "/upload"}
  });

  Stat.uploadData = function (filePath) {
    return new Promise((resolve, reject) => {
      const workbook = new Excel.stream.xlsx.WorkbookReader();
      const options = {
        entries: "emit",
        sharedStrings: "cache",
        styles: "emit",
        hyperlinks: "emit",
        worksheets: "emit"
      };
      workbook.on('error', function (error) {
        reject(error);
      });

      workbook.on('worksheet', function (worksheet) {
        worksheet.on('row', function (row) {
          const [machine, attribute, reading] = row.model.cells;
          if (machine.address !== "A1") {

            const statModel = {
              machine: machine.value,
              attribute: attribute.value,
              reading: reading.value
            };
            Stat.upsertWithWhere(
              {
                machine: machine.value,
                attribute: attribute.value
              },
              statModel,
              (err, model) => {
                if (err) throw err;

                console.log('Created:', model);
              });
          }
        });

      });

      workbook.on('finished', function () {
        resolve();
      });

      const readStream = fs.createReadStream(filePath);

      workbook.read(readStream, options);
    });
  };

  Stat.download = function (cb) {
    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet('Sheet1');
    worksheet.columns = [
      {header: 'Machine', key: 'machine'},
      {header: 'Attribute', key: 'attribute'},
      {header: 'Reading', key: 'reading'}
    ];

    Stat.find({}, (err, models) => {
      models.forEach(model => {
        worksheet.addRow({
          machine: model.machine,
          attribute: model.attribute,
          reading: model.reading
        });
      });

      const str = new stream.PassThrough();

      workbook.xlsx.write(str);
      cb(null, str, 'application/octet-stream');
    });
  };

  Stat.remoteMethod('download', {
    isStatic: true,
    http: {path: '/download', verb: 'get'},
    returns: [
      {arg: 'body', type: 'file', root: true},
      {
        arg: 'Content-Type', type: 'application/octet-stream',
        http: {target: 'header'}
      },
      {
        arg: 'Content-Disposition', type: 'attachment; filename="result.xlsx"',
        http: {target: 'header'}
      }
    ]
  });

  Stat.disableRemoteMethodByName("create", true);
  Stat.disableRemoteMethodByName("upsert", true);
  Stat.disableRemoteMethodByName("updateAll", true);
  Stat.disableRemoteMethodByName("updateAttributes", true);
  Stat.disableRemoteMethodByName("replaceOrCreate", true);
  Stat.disableRemoteMethodByName("upsertWithWhere", true);
  Stat.disableRemoteMethodByName("replaceById", true);
  Stat.disableRemoteMethodByName("createChangeStream", true);

  Stat.disableRemoteMethodByName("find", true);
  Stat.disableRemoteMethodByName("findById", true);
  Stat.disableRemoteMethodByName("findOne", true);

  Stat.disableRemoteMethodByName("deleteById", true);

  Stat.disableRemoteMethodByName("confirm", true);
  Stat.disableRemoteMethodByName("count", true);
  Stat.disableRemoteMethodByName("exists", true);
  Stat.disableRemoteMethodByName("resetPassword", true);

  Stat.disableRemoteMethodByName('__count__accessTokens', true);
  Stat.disableRemoteMethodByName('__create__accessTokens', true);
  Stat.disableRemoteMethodByName('__delete__accessTokens', true);
  Stat.disableRemoteMethodByName('__destroyById__accessTokens', true);
  Stat.disableRemoteMethodByName('__findById__accessTokens', true);
  Stat.disableRemoteMethodByName('__get__accessTokens', true);
  Stat.disableRemoteMethodByName('__updateById__accessTokens', true);

  Stat.disableRemoteMethodByName('__get__tags', true);
  Stat.disableRemoteMethodByName('__create__tags', true);
  Stat.disableRemoteMethodByName('__destroyById__accessTokens', true); // DELETE
  Stat.disableRemoteMethodByName('__updateById__accessTokens', true); // PUT

};
