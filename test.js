var assert = require('assert'),
    fs = require('fs'),
	chrome = require('selenium-webdriver/chrome'),
	path = require('chromedriver').path,
    test = require('selenium-webdriver/testing'),
    webdriver = require('selenium-webdriver'),
	csvToJsonConverter = require('csvtojson').Converter,
	converter = new csvToJsonConverter({}),

	credentials = require('./credentials.json');

function timeout(ms) {
 	var d = webdriver.promise.defer();
	var start = Date.now();
	setTimeout(function() {
	   d.fulfill(Date.now() - start);
	}, ms);
	return d.promise;
}

test.describe('Xero Receipt Import', function () {
	this.timeout(60000);

	var driver,
		data;

	test.before(function (done) {
		service = new chrome.ServiceBuilder(path).build();

		chrome.setDefaultService(service);

		driver = new webdriver.Builder().
			withCapabilities(webdriver.Capabilities.chrome()).
			build();

		converter.on("end_parsed", function (jsonArray) {
			data = jsonArray;
			done();
		});

		fs.createReadStream('./data.csv').pipe(converter);
	});

	test.after(function () {
		driver.quit();
	});

	test.describe('Will import all of the receipts', function() {
		for (var i = 0, ii = 3; i < ii; i += 1) {
			test.it('Importing receipt "' + data[i]['date'] + ' - ' + data[i]['Receipt from'] + '"', function () {
				driver.get('https://go.xero.com/Expenses/EditReceipt.aspx');

				driver.findElement(webdriver.By.name('userName')).sendKeys(credentials.username);
				driver.findElement(webdriver.By.name('password')).sendKeys(credentials.password);
				driver.findElement(webdriver.By.id('submitButton')).click();

				driver.wait(function () {
					return driver.isElementPresent(webdriver.By.linkText('Save & Add Another Receipt'));
				}, 60000);

				driver.findElement(webdriver.By.name('CleanInvoiceID')).getAttribute('value').then(function (invoice) {
					var paidTo = driver.findElement(webdriver.By.name('PaidToName_' + invoice + '_value')),
						datePaid = driver.findElement(webdriver.By.name('InvoiceDate_' + invoice)),
						ref = driver.findElement(webdriver.By.name('InvoiceNumber_' + invoice));

					paidTo.sendKeys(data[i]['Receipt from']);
					driver.sleep(3000);

					datePaid.click();
					datePaid.sendKeys(data[i]['Date']);
					ref.sendKeys(data[i]['Reference']);

					driver.findElement(webdriver.By.className('xoLineItemIDs')).getAttribute('value').then(function (lineitem) {
						var desc = driver.findElement(webdriver.By.name('Description_' + lineitem)),
							quan = driver.findElement(webdriver.By.name('Quantity_' + lineitem)),
							unit = driver.findElement(webdriver.By.name('UnitAmount_' + lineitem)),
							acco = driver.findElement(webdriver.By.name('Account_' + lineitem + '_value')),
							tax = driver.findElement(webdriver.By.name('GSTCode_' + lineitem + '_value'));

						desc.clear();
						desc.sendKeys(data[i]['Description']);

						quan.clear();
						quan.sendKeys('' + data[i]['Quantity']);

						unit.clear();
						unit.sendKeys('' + data[i]['Unit Price']);

						acco.clear();
						acco.sendKeys('' + data[i]['Account']);
						driver.sleep(2000);

						tax.clear();
						tax.sendKeys('' + data[i]['Tax Rate']);
						driver.sleep(2000);

						desc.click();
						driver.findElement(webdriver.By.linkText('Save & Add Another Receipt')).click();
						driver.sleep(6000);
					});
				});
			});
		}
	});
});