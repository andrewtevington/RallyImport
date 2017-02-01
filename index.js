function createUserStoriesAndTasks(rally, user, pass, companyList, portfolioItem) {
	loopObjectKeys(companyList, function(index, company) {
		createObject(rally, user, pass, "hierarchicalrequirement", formatCompanyInfo(company, portfolioItem), function(userStory, error) {
			if (error) {
				console.log("ERROR: " + company.CompanyKey);
			}
		});
	});
}

function getCompaniesFromFile(fs, companyFile, callback) {
	var companies = [];
	
	fs.readFile(companyFile, "utf8", function(err, content) {
		var lines = content ? content.split(/\r?\n/) : [];
		var header = lines[0] ? lines[0].split(/\t/) : [];

		loopObjectKeys(lines, function(lineIndex, line) {
			if (lineIndex > 0 && line.length > 0) {
				var company = {};
				
				loopObjectKeys(line.split(/\t/), function(columnIndex, val) {
					if (header[columnIndex]) {
						company[header[columnIndex]] = !isNaN(parseFloat(val)) && isFinite(val) ? parseFloat(val) : val;
					}
				});
				
				companies.push(new CompanyInfo(company));
			}
		});
		
		callback(companies);
	});
}

function createObject(rally, user, pass, type, data, callback) {
	rally({ user: user, pass: pass }).create(
		{
			type: type,
			data: data
		},
		function(error, result) {
			if (callback) {
				callback(result, error);
			}
		}
	);
}

function CompanyInfo(info) {
	this.CompanyKey = "";
	this.Company = "";
	this.Database = "";
	this.CustomCodeHours = 0;
	this.CustomOrderHours = 0;
	this.CustomStatementHours = 0;
	this.CustomInvoiceHours = 0;
	this.CustomRenewalHours = 0;
	this.CustomConsolidatedInvoiceHours = 0;
	this.CustomWDIFormsHours = 0;
	this.CustomReportsHours = 0;
	this.EstimatedHours = 0;
	this.LoginsLast30Days = 0;
	this.ClassicActivityLast30Days = 0;
	this.CrossBrowserActivityLast30Days = 0;
	this.Paying	= true;
	
	Object.assign(this, info || {});
}

function formatCompanyInfo(companyInfo, portfolioItem) {
	var formatted = {};
	
	formatted.PlanEstimate = Math.round(companyInfo.EstimatedHours / 7 * 100) / 100;
	formatted.PortfolioItem = portfolioItem;
	formatted.Name = companyInfo.Company + " (" + companyInfo.CompanyKey + ")";
	formatted.Description = "";
	
	loopObjectKeys(companyInfo, function(key, val) {
		formatted.Description = formatted.Description + sanitizeKey(key) + ": " + val + "<br>";
	});
	
	return formatted;
}

function loopObjectKeys(obj, callback) {
	for (var key in obj) {
		if (obj.hasOwnProperty(key)) {
			callback.apply(obj, [key, obj[key]]);
		}
	}
}

function sanitizeKey(key) {
	return key.split(/(?=[A-Z])/).join(" ").split("Last").join("Last ").split("W D I").join("WDI ").trim();
}

var fs = require("fs");
var rally = require("rally");
var user = process.argv[2] || "";
var pass = process.argv[3] || "";
var portfolioItem = (process.argv[4] || "").trim();
var companyFile = (process.argv[5] || "").trim();

if (user && pass && portfolioItem && companyFile) {
	getCompaniesFromFile(fs, companyFile, function(companies) {
		var chunkSize = 20;
		var delay = 10000;
		var iterations = Math.ceil(companies.length / chunkSize);
		
		for (var i = 0; i < iterations; i++) {
			var doWork = function(wait, start, end, callback) {
				setTimeout(function() {
					console.log(start, end);
					createUserStoriesAndTasks(rally, user, pass, companies.slice(start, end), portfolioItem)
				}, wait);
			};
			
			doWork((i + 1) * delay, i * chunkSize, (i * chunkSize) + chunkSize);
		}
	});
}