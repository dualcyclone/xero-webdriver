var assert = require('assert'),
    fs = require('fs'),
    chrome = require('selenium-webdriver/chrome'),
    path = require('chromedriver').path,
    webdriver = require('selenium-webdriver'),
    csvToJsonConverter = require('csvtojson').Converter,
    converter = new csvToJsonConverter({}),

    credentials = require('./credentials.json');

function timeout(ms) {
    var d = webdriver.promise.defer();
    var start = Date.now();
    setTimeout(function () {
        d.fulfill(Date.now() - start);
    }, ms);
    return d.promise;
}

var driver;

service = new chrome.ServiceBuilder(path).build();

chrome.setDefaultService(service);

driver = new webdriver.Builder().
    withCapabilities(webdriver.Capabilities.chrome()).
    build();

converter.on("end_parsed", function (jsonArray) {
    startImport(jsonArray);
});

fs.createReadStream('./data.csv').pipe(converter);

function startImport(data) {
    console.log('STARTING THE IMPORT!');

    driver.get('https://go.xero.com/Expenses/EditReceipt.aspx');

    driver.sleep(2000);

    driver.findElement(webdriver.By.name('userName')).sendKeys(credentials.username);
    driver.findElement(webdriver.By.name('password')).sendKeys(credentials.password);
    driver.findElement(webdriver.By.id('submitButton')).click();

    driver.wait(function () {
        return driver.isElementPresent(webdriver.By.linkText('Save & Add Another Receipt'));
    }, 60000);

    function importReceipt(receiptData) {
        console.log('Importing receipt "' + receiptData['Date'] + ' - ' + receiptData['Receipt from'] + '"');
        driver.findElement(webdriver.By.name('CleanInvoiceID')).getAttribute('value').then(function (invoice) {
            var paidTo = driver.findElement(webdriver.By.name('PaidToName_' + invoice + '_value')),
                datePaid = driver.findElement(webdriver.By.name('InvoiceDate_' + invoice)),
                ref = driver.findElement(webdriver.By.name('InvoiceNumber_' + invoice));

            paidTo.sendKeys(receiptData['Receipt from']);
            driver.sleep(3000);

            datePaid.click();
            datePaid.sendKeys(receiptData['Date']);
            ref.sendKeys(receiptData['Reference']);

            driver.findElement(webdriver.By.className('xoLineItemIDs')).getAttribute('value').then(function (lineitem) {
                var desc = driver.findElement(webdriver.By.name('Description_' + lineitem)),
                    quan = driver.findElement(webdriver.By.name('Quantity_' + lineitem)),
                    unit = driver.findElement(webdriver.By.name('UnitAmount_' + lineitem)),
                    acco = driver.findElement(webdriver.By.name('Account_' + lineitem + '_value')),
                    tax = driver.findElement(webdriver.By.name('GSTCode_' + lineitem + '_value'));

                desc.clear();
                desc.sendKeys(receiptData['Description']);

                quan.clear();
                quan.sendKeys('' + receiptData['Quantity']);

                unit.clear();
                unit.sendKeys('' + receiptData['Unit Price']);

                acco.clear();
                acco.sendKeys('' + receiptData['Account']);
                driver.sleep(2000);

                tax.clear();
                tax.sendKeys('' + receiptData['Tax Rate']);
                driver.sleep(2000);

                desc.click();
                driver.findElement(webdriver.By.linkText('Save & Add Another Receipt')).click();
                driver.sleep(6000);
            });
        });

        driver.wait(function () {
            return driver.isElementPresent(webdriver.By.linkText('Save & Add Another Receipt'));
        }, 60000);

        if (data.length > 0) {
            importReceipt(data.shift());
        } else {
            console.log('****** FINISHED! ******');
            driver.quit();
        }
    }

    importReceipt(data.shift());
}
