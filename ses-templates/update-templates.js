const fs = require('fs');
const path = require('path');
require('babel-register');

const AWS = require('aws-sdk');

AWS.config.update({
  region: 'eu-central-1',
  accessKeyId: 'AKIA6N6TXY6BYWTY4RMZ',
  secretAccessKey: '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'
});

async function convertHtmlToSESTemplate() {


  var walk = function(dir, done) {
    var results = [];
    fs.readdir(dir, function(err, list) {
      if (err) return done(err);
      var pending = list.length;
      if (!pending) return done(null, results);
      list.forEach(function(file) {
        file = path.resolve(dir, file);
        fs.stat(file, function(err, stat) {
          if (stat && stat.isDirectory()) {
            walk(file, function(err, res) {
              results = results.concat(res);
              if (!--pending) done(null, results);
            });
          } else {
            results.push(file);
            if (!--pending) done(null, results);
          }
        });
      });
    });
  };

  const directoryPath = path.join(__dirname, '');

  let listTemplates = await (new AWS.SES({apiVersion: '2012-10-17'}).listTemplates({MaxItems: 100}).promise());
  listTemplates = listTemplates.TemplatesMetadata.map( el => el.Name);

  let filePaths = await new Promise((resolve, reject) => {
    walk(directoryPath, function(err, results) {
      if (err) {
        reject()
      } else {
        resolve(results.filter( el => path.extname(el).toLowerCase() == '.html'));
      }
    });
  });

  for (let i = 0; i < filePaths.length; i++) {
    try {
      const fileName = path.basename(filePaths[i], '.html');
      let htmlContent = fs.readFileSync(filePaths[i], 'utf8');
      htmlContent = htmlContent.replace(/\$\{([a-zA-Z]+)\}/g, '{{$1}}');
      htmlContent = htmlContent.replace('"{unsubscribe}"', '"{{unsubscribe}}"');
      subjectMatch = htmlContent.match(/\<title\>(.+)\<\/title\>/);
      const data = {
        Template: {
          TemplateName: fileName,
          SubjectPart: subjectMatch[1],
          HtmlPart: htmlContent
        }
      }
      if (listTemplates.includes(fileName)) {
        await (new AWS.SES({apiVersion: '2012-10-17'}).updateTemplate(data).promise());
      } else {
        await (new AWS.SES({apiVersion: '2012-10-17'}).createTemplate(data).promise());
      }
    } catch (error) {
      console.log(error)
    }
  }
}

convertHtmlToSESTemplate();
