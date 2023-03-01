const fs = require('fs');
const path = require('path');
const replaceExt = require('replace-ext');

const AWS = require('aws-sdk');

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


  walk(directoryPath, function(err, results) {
    if (err) throw err;
    results.forEach(function(filePath) {
    
      try {

        if (path.extname(filePath).toLowerCase() != '.html') throw '';
        const jsonFilePath = replaceExt(filePath, '.json');
        const fileName = path.basename(filePath, '.html');

        let htlmContent = fs.readFileSync(filePath, 'utf8');
        htlmContent = htlmContent.replace(/\$\{([a-zA-Z]+)\}/g, '{{$1}}');
        htlmContent = htlmContent.replace('"{unsubscribe}"', '"{{unsubscribe}}"');
        const data = {
          Template: {
            TemplateName: fileName,
            SubjectPart: 'startupswallet.com',
            HtmlPart: htlmContent
          }
        }
        fs.writeFileSync(jsonFilePath, JSON.stringify(data))
      } catch (error) {
        console.log(error);
      }
    })
  });
  
}

convertHtmlToSESTemplate();
