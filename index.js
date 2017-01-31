function createUserStoriesAndTasks(api, companyList, portfolioItem) {
	loopObjectKeys(companyList, function(index, company) {
		
		createObject(api, "hierarchicalrequirement", formatCompanyInfo(company, portfolioItem), function(userStory, error) {
			
			loopObjectKeys(company, function(key, val) {
				
				if (key.substr(0, 6).toLowerCase() === "custom" && val > 0) {
					var taskData = {
						Name: sanitizeKey(key).split("Hours")[0].trim(),
						Project: userStory.Object.Project,
						WorkProduct: userStory.Object,
						Estimate: val
					};

					createObject(api, "task", taskData);
				}
			});
		});
	});
}

function getCompaniesFromFile(companyFile, callback) {
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

function createObject(api, type, data, callback) {
	api.create(
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
var password = process.argv[3] || "";
var portfolioItem = (process.argv[4] || "").trim();
var companyFile = (process.argv[5] || "").trim();

if (user && password && portfolioItem && companyFile) {
	var rallyAPI = rally({ user: user, pass: password });
	
	getCompaniesFromFile(companyFile, function(companies) {
		createUserStoriesAndTasks(rallyAPI, companies, portfolioItem);
	});
}