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

test.describe('My Website', function () {
	this.timeout(15000);

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

	test.it('Contact form should return success', function () {
		driver.get('https://go.xero.com/Expenses/EditReceipt.aspx');

		driver.findElement(webdriver.By.name('userName')).sendKeys(credentials.username);
		driver.findElement(webdriver.By.name('password')).sendKeys(credentials.password);
		driver.findElement(webdriver.By.id('submitButton')).click();

		driver.wait(function () {
			var paidToContact = driver.findElement(webdriver.By.id('PaidToContactID')).getAttribute('value'),
				paidToContactVal = paidToContact.getAttribute("value");

			console.log('************************************* VAL!', paidToContactVal);

		}, 3000);

		driver.findElement(webdriver.By.name('CleanInvoiceID')).getAttribute('value').then(function (invoice) {

			driver.findElement(webdriver.By.name('PaidToName_' + invoice + '_value')).sendKeys(data[0]['Receipt From']);

			driver.wait(function () {
				return driver.findElement(webdriver.By.className('autocompleter-contacts')).isDisplayed();
			}, 3000);

			driver.findElement(webdriver.By.name('InvoiceDate_' + invoice)).click();

			driver.findElement(webdriver.By.name('InvoiceDate_' + invoice)).sendKeys(data[0]['Date']);
			driver.findElement(webdriver.By.name('InvoiceNumber_' + invoice)).sendKeys(data[0]['Reference']);

			driver.findElement(webdriver.By.className('xoLineItemIDs')).getAttribute('value').then(function (lineitem) {
				driver.findElement(webdriver.By.name('Description_' + lineitem)).sendKeys(data[0]['Description']);
				driver.findElement(webdriver.By.name('Quantity_' + lineitem)).sendKeys(webdriver.Key.CONTROL, "a", data[0]['Quantity']);
				driver.findElement(webdriver.By.name('UnitAmount_' + lineitem)).sendKeys(webdriver.Key.CONTROL, "a", data[0]['Unit Price']);

				driver.findElement(webdriver.By.name('Account_' + lineitem + '_value')).sendKeys(webdriver.Key.CONTROL, "a", data[0]['Account']);

				driver.findElement(webdriver.By.name('GSTCode_' + lineitem + '_value')).sendKeys(webdriver.Key.CONTROL, "a", data[0]['Tax Rate']);

				timeout(30000).then(function(){console.log('***************************** DONE!')});

				//driver.findElement(webdriver.By.linkText('Save & Add Another Receipt')).click();
				//driver.wait(function(){
				//	return driver.findElement(webdriver.By.id('PaidToContactID')).getAttribute('value') === '';
				//}, 5000);
			});
		});
	});
});