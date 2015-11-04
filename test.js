var assert = require('assert'),
    fs = require('fs'),
	chrome = require('selenium-webdriver/chrome'),
	path = require('chromedriver').path,
    test = require('selenium-webdriver/testing'),
    webdriver = require('selenium-webdriver');

function timeout(ms) {
 	var d = webdriver.promise.defer();
	var start = Date.now();
	setTimeout(function() {
	   d.fulfill(Date.now() - start);
	}, ms);
	return d.promise;
}

test.describe('My Website', function(){
    this.timeout(15000);

	var driver;

    test.before(function(){
		service = new chrome.ServiceBuilder(path).build();

		chrome.setDefaultService(service);

		driver = new webdriver.Builder().
	        withCapabilities(webdriver.Capabilities.chrome()).
	        build();
    });

    test.after(function(){
        driver.quit();
    });


	test.it('Contact form should return success', function(){
	    driver.get('https://go.xero.com/Expenses/EditReceipt.aspx');
	
		driver.findElement(webdriver.By.name('userName')).sendKeys('nothing');
		driver.findElement(webdriver.By.name('password')).sendKeys('');
		driver.findElement(webdriver.By.id('submitButton')).click();
		
		driver.wait(function(){
			
			console.log('************',driver.findElement(webdriver.By.id('PaidToContactID')).getAttribute('value'))
	    	driver.findElement(webdriver.By.id('PaidToContactID')).getAttribute('value').then(function(value) {
				console.log('*****************',value);
				return
			});
	    }, 3000);
		
		driver.findElement(webdriver.By.name('CleanInvoiceID')).getAttribute('value').then(function(invoice) {
		
		
			driver.findElement(webdriver.By.name('PaidToName_'+invoice+'_value')).sendKeys('Luke Dyson');
			
			driver.wait(function(){
		    	return driver.findElement(webdriver.By.className('autocompleter-contacts')).isDisplayed();
		    }, 3000);
			
			driver.findElement(webdriver.By.name('InvoiceDate_'+invoice)).click();
			
			driver.findElement(webdriver.By.name('InvoiceDate_'+invoice)).sendKeys('5 1 11');
			driver.findElement(webdriver.By.name('InvoiceNumber_'+invoice)).sendKeys('5 1 11');
			
			
			driver.findElement(webdriver.By.className('xoLineItemIDs')).getAttribute('value').then(function(lineitem) {
				driver.findElement(webdriver.By.name('Description_'+lineitem)).sendKeys('5 1 11');
				driver.findElement(webdriver.By.name('Quantity_'+lineitem)).sendKeys(webdriver.Key.CONTROL,"a",'5 1 11');
				driver.findElement(webdriver.By.name('UnitAmount_'+lineitem)).sendKeys(webdriver.Key.CONTROL,"a",'5 1 11');


				driver.findElement(webdriver.By.name('Account_'+lineitem+'_value')).sendKeys(webdriver.Key.CONTROL,"a",'429 - General Expenses');

				
				driver.findElement(webdriver.By.name('GSTCode_'+lineitem+'_value')).sendKeys(webdriver.Key.CONTROL,"a",'No VAT');

				driver.findElement(webdriver.By.linkText('Save & Add Another Receipt')).click();
				driver.wait(function(){
			    	return driver.findElement(webdriver.By.id('PaidToContactID')).getAttribute('value') === '';
			    }, 5000);

			

				
				
			});
			
		});
		
		
		
	});
});